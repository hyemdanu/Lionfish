import cv2
from ultralytics import YOLO
from collections import deque
import time
from flask import Flask, Response, jsonify, send_file, request
import threading
import signal
import sys
from datetime import datetime
import os
import uuid
import serial
import random
import requests
import json

app = Flask(__name__)

# detection images
DETECTION_DIR = "detection_images"
os.makedirs(DETECTION_DIR, exist_ok=True)

# variables
frame_buffer = None
detection_data = {
    "detected": False,
    "confidence": 0,
    "timestamp": "",
    "location": "Main Camera",
    "image_id": ""
}
detection_history = []
frame_lock = threading.Lock()
detection_lock = threading.Lock()
stop_event = threading.Event()

# load YOLO model
model = YOLO("/home/hyemdanu/Lionfish/runs/train/lionfish_yolov11s/weights/best.pt")

# setting up serial communication with Arduino (change '/dev/ttyUSB0' to your port)
try:
    arduino = serial.Serial('/dev/ttyUSB0', 9600, timeout=1)
    time.sleep(2)  # wait for connection
except serial.SerialException:
    print("Could not connect to Arduino.")
    arduino = None


def get_laptop_location():
    """
    Get the current location of the laptop using IP-based geolocation.
    Returns a dictionary with latitude, longitude, and region information.
    """
    try:
        # Use IP-based geolocation services to get approximate location
        response = requests.get('https://ipinfo.io/json')
        if response.status_code == 200:
            data = response.json()

            # Check if location data is available
            if 'loc' in data and data['loc']:
                # Parse coordinates from the 'loc' field (format: "latitude,longitude")
                lat, lng = map(float, data['loc'].split(','))

                # Get region information
                region = data.get('city', 'Unknown')
                if 'region' in data and data['region']:
                    region += f", {data['region']}"
                if 'country' in data and data['country']:
                    region += f", {data['country']}"

                return {
                    "latitude": round(lat, 6),
                    "longitude": round(lng, 6),
                    "region": region,
                    "source": "Laptop"
                }
    except Exception as e:
        print(f"Error getting laptop location: {e}")

    # Fallback to a default location if the API request fails
    return None


def generate_realistic_lionfish_location():
    """
    Generate realistic coordinates for lionfish sightings in their natural habitat.
    Used as a fallback when real location data is not available.
    """
    # Define regions where lionfish are commonly found (all in ocean, not on land)
    lionfish_regions = [
        # Florida Keys and Caribbean
        {"name": "Florida Keys", "lat_range": (24.28, 25.85), "lng_range": (-82.15, -80.10)},
        {"name": "Bahamas", "lat_range": (23.5, 27.0), "lng_range": (-79.5, -74.0)},
        {"name": "Puerto Rico", "lat_range": (17.9, 18.5), "lng_range": (-67.3, -65.2)},
        {"name": "Jamaica", "lat_range": (17.5, 18.5), "lng_range": (-78.5, -76.0)},

        # Gulf of Mexico
        {"name": "Gulf of Mexico", "lat_range": (24.0, 29.0), "lng_range": (-97.0, -83.0)},

        # Western Atlantic
        {"name": "Bermuda", "lat_range": (32.2, 32.4), "lng_range": (-64.9, -64.6)},
        {"name": "U.S. East Coast", "lat_range": (25.0, 35.0), "lng_range": (-82.0, -75.0)},

        # Other invasion areas
        {"name": "Cayman Islands", "lat_range": (19.2, 19.4), "lng_range": (-81.4, -81.1)},
        {"name": "Belize Barrier Reef", "lat_range": (16.1, 18.5), "lng_range": (-88.1, -87.5)},
        {"name": "Cozumel", "lat_range": (20.3, 20.5), "lng_range": (-87.0, -86.9)}
    ]

    # Randomly select a region
    region = random.choice(lionfish_regions)

    # Generate random coordinates within the selected region
    lat = random.uniform(region["lat_range"][0], region["lat_range"][1])
    lng = random.uniform(region["lng_range"][0], region["lng_range"][1])

    return {
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "region": region["name"],
        "source": "Simulated"
    }


def generate_frames():
    while not stop_event.is_set():
        global frame_buffer
        with frame_lock:
            if frame_buffer is not None:
                _, encoded_frame = cv2.imencode('.jpg', frame_buffer)
                frame_data = encoded_frame.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')
        time.sleep(0.03)


def detection_thread():
    global frame_buffer, detection_data, detection_history

    # Camera
    cap = cv2.VideoCapture(0)

    # Get average of 15 for a better average
    confidence_history = deque(maxlen=15)

    last_detection_time = time.time()

    try:
        while not stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                continue

            # Get results
            results = model(frame, verbose=False)

            detected = False
            current_confidences = []

            # Get the confidence results
            for result in results:
                if result.boxes:
                    for box in result.boxes:
                        conf = box.conf[0].item() * 100
                        current_confidences.append(conf)

            # Calculate smoothed confidence
            if current_confidences:
                avg_conf = sum(current_confidences) / len(current_confidences)
                confidence_history.append(avg_conf)

                smoothed_conf = sum(confidence_history) / len(confidence_history)

                # Only draw boxes if smoothed confidence is high enough
                if smoothed_conf >= 65:
                    detected = True
                    if arduino:
                        arduino.write(b'1')  # Send signal to turn on light

                    # If it's new detection
                    if time.time() - last_detection_time > 5:
                        # Generate a unique ID for this detection image
                        image_id = str(uuid.uuid4())
                        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                        # Get laptop location
                        location_data = get_laptop_location()

                        # If laptop location isn't available, use simulated location
                        if not location_data:
                            location_data = generate_realistic_lionfish_location()

                        # Format location as string for display
                        location_str = f"{location_data['latitude']},{location_data['longitude']}"

                        # Log detection with location
                        print(f"Lionfish detected! Location: {location_str} (Source: {location_data['source']})")

                        # Save the current frame with detection boxes
                        detection_frame = frame.copy()

                        # Draw boxes on the saved frame
                        for result in results:
                            if result.boxes:
                                for box in result.boxes:
                                    conf = box.conf[0].item() * 100
                                    if conf >= 50:
                                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                                        cv2.rectangle(detection_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                                        cv2.putText(detection_frame, f"{conf:.2f}%", (x1, y1 - 10),
                                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                        # Save the frame with detection boxes
                        image_path = os.path.join(DETECTION_DIR, f"{image_id}.jpg")
                        cv2.imwrite(image_path, detection_frame)

                        # Update detection data
                        with detection_lock:
                            detection_data = {
                                "detected": True,
                                "confidence": round(smoothed_conf, 2),
                                "timestamp": timestamp,
                                "location": location_str,
                                "location_source": location_data.get("source", "Unknown"),
                                "region": location_data.get("region", "Unknown"),
                                "image_id": image_id
                            }

                            # Add to history
                            detection_history.append(detection_data.copy())
                            # Keep only the most recent 50 detections in history
                            if len(detection_history) > 50:
                                # Remove the oldest detection image file
                                old_image_id = detection_history[0]["image_id"]
                                old_image_path = os.path.join(DETECTION_DIR, f"{old_image_id}.jpg")
                                if os.path.exists(old_image_path):
                                    os.remove(old_image_path)
                                detection_history.pop(0)

                        last_detection_time = time.time()

                    # Draw boxes on the live stream
                    for result in results:
                        if result.boxes:
                            for box in result.boxes:
                                conf = box.conf[0].item() * 100
                                if conf >= 50:
                                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                                    cv2.putText(frame, f"{conf:.2f}%", (x1, y1 - 10),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Always send '0' when detection is False
            if not detected and arduino:
                arduino.write(b'0')  # Send signal to turn off light

            # Update frame
            with frame_lock:
                frame_buffer = frame.copy()
    finally:
        cap.release()
        if arduino:
            arduino.close()
        print("Camera and Arduino released")


def shutdown_server():
    print("Shutting down server...")
    stop_event.set()
    time.sleep(1)
    sys.exit(0)


def signal_handler(sig, frame):
    print('Caught signal, shutting down...')
    shutdown_server()


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/detection_data')
def get_detection_data():
    with detection_lock:
        return jsonify(detection_data)


@app.route('/detection_history')
def get_detection_history():
    with detection_lock:
        return jsonify(detection_history)


@app.route('/detection_image/<image_id>')
def get_detection_image(image_id):
    image_path = os.path.join(DETECTION_DIR, f"{image_id}.jpg")
    if os.path.exists(image_path):
        return send_file(image_path, mimetype='image/jpeg')
    else:
        return jsonify({"error": "Image not found"}), 404


@app.route('/all_detections')
def get_all_detections():
    """
    Endpoint to return all detections for the map view.
    Returns a list of all detections with location data.
    Also supports a single=true parameter to return just one detection for new logs.
    """
    with detection_lock:
        formatted_detections = []
        single_mode = request.args.get('single') == 'true'

        # Use actual detection history data
        for detection in detection_history:
            # Get the detection ID
            image_id = detection.get("image_id", "")

            # Create detection object with all required fields for the map
            detection_obj = {
                "id": image_id if image_id else str(random.randint(1000, 9999)),
                "location": detection.get("location", ""),
                "timestamp": detection.get("timestamp", ""),
                "confidence": detection.get("confidence", 0),
                "image_id": image_id,
                "region": detection.get("region", "Unknown"),
                "location_source": detection.get("location_source", "Unknown")
            }

            formatted_detections.append(detection_obj)

            # If we only need one detection for a new log entry
            if single_mode:
                break

        return jsonify({"detections": formatted_detections})


@app.route('/test_location')
def test_location():
    """
    Endpoint to test the current laptop location
    """
    location = get_laptop_location()
    if location:
        return jsonify(location)
    else:
        return jsonify({"error": "Could not determine location"}), 404


@app.route('/shutdown', methods=['POST'])
def shutdown():
    shutdown_server()
    return jsonify({"status": "Server shutting down"})


if __name__ == '__main__':
    try:
        detection_thread = threading.Thread(target=detection_thread)
        detection_thread.daemon = True
        detection_thread.start()

        print("CTRL+C to quit.")
        app.run(host='0.0.0.0', port=5000, threaded=True, processes=1)
    except KeyboardInterrupt:
        print("Quitting")
        shutdown_server()