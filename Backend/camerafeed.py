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


def generate_realistic_lionfish_location():
    """
    generate realistic coordinates for lionfish sightings in their natural habitat.
    lionfish are invasive in the Caribbean, Gulf of Mexico, and western Atlantic.
    """
    # define regions where lionfish are commonly found (all in ocean, not on land)
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

    # randomly select a region
    region = random.choice(lionfish_regions)

    # generate random coordinates within the selected region
    lat = random.uniform(region["lat_range"][0], region["lat_range"][1])
    lng = random.uniform(region["lng_range"][0], region["lng_range"][1])

    return {
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "region": region["name"]
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

    # camera
    cap = cv2.VideoCapture(0)

    # get average of 15 for a better average
    confidence_history = deque(maxlen=15)

    last_detection_time = time.time()

    try:
        while not stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                continue

            # get results
            results = model(frame, verbose=False)

            detected = False
            current_confidences = []

            # get the confidence results
            for result in results:
                if result.boxes:
                    for box in result.boxes:
                        conf = box.conf[0].item() * 100
                        current_confidences.append(conf)

            # calculate smoothed confidence
            if current_confidences:
                avg_conf = sum(current_confidences) / len(current_confidences)
                confidence_history.append(avg_conf)

                smoothed_conf = sum(confidence_history) / len(confidence_history)

                # only draw boxes if smoothed confidence is high enough
                if smoothed_conf >= 65:
                    detected = True
                    if arduino:
                        arduino.write(b'1')  # send signal to turn on light

                    # if its new detection
                    if time.time() - last_detection_time > 5:
                        # generate a unique ID for this detection image
                        image_id = str(uuid.uuid4())
                        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                        # save the current frame with detection boxes
                        detection_frame = frame.copy()

                        # draw boxes on the saved frame
                        for result in results:
                            if result.boxes:
                                for box in result.boxes:
                                    conf = box.conf[0].item() * 100
                                    if conf >= 50:
                                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                                        cv2.rectangle(detection_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                                        cv2.putText(detection_frame, f"{conf:.2f}%", (x1, y1 - 10),
                                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                        # save the frame with detection boxes
                        image_path = os.path.join(DETECTION_DIR, f"{image_id}.jpg")
                        cv2.imwrite(image_path, detection_frame)

                        # update detection data
                        with detection_lock:
                            detection_data = {
                                "detected": True,
                                "confidence": round(smoothed_conf, 2),
                                "timestamp": timestamp,
                                "location": "Main Camera",
                                "image_id": image_id
                            }

                            # add to history
                            detection_history.append(detection_data.copy())
                            # keep only the most recent 50 detections in history
                            if len(detection_history) > 50:
                                # remove the oldest detection image file
                                old_image_id = detection_history[0]["image_id"]
                                old_image_path = os.path.join(DETECTION_DIR, f"{old_image_id}.jpg")
                                if os.path.exists(old_image_path):
                                    os.remove(old_image_path)
                                detection_history.pop(0)

                        last_detection_time = time.time()

                    # draw boxes on the live stream
                    for result in results:
                        if result.boxes:
                            for box in result.boxes:
                                conf = box.conf[0].item() * 100
                                if conf >= 50:
                                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                                    cv2.putText(frame, f"{conf:.2f}%", (x1, y1 - 10),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # always send '0' when detection is False
            if not detected and arduino:
                arduino.write(b'0')  # send signal to turn off light

            # update frame
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
    endpoint to return all detections for the map view.
    returns a list of all detections with realistic location data.
    also supports a single=true parameter to return just one detection for new logs.
    """
    with detection_lock:
        formatted_detections = []
        single_mode = request.args.get('single') == 'true'

        # Use actual detection history data
        for detection in detection_history:
            # Generate a consistent location for each detection based on its image_id
            # This ensures a detection keeps the same location between requests
            image_id = detection.get("image_id", "")

            # Use image_id to seed the random number generator for consistent results
            if image_id:
                # Create a deterministic seed from the image_id string
                seed = sum(ord(c) for c in image_id)
                random.seed(seed)

            # Generate realistic location
            location_data = generate_realistic_lionfish_location()

            # Format as string
            location = f"{location_data['latitude']},{location_data['longitude']}"

            # Create detection object with all required fields for the map
            detection_obj = {
                "id": detection.get("image_id", str(random.randint(1000, 9999))),
                "location": location,
                "timestamp": detection.get("timestamp", ""),
                "confidence": detection.get("confidence", 0),
                "image_id": detection.get("image_id", ""),
                "region": location_data["region"]  # include region name
            }

            formatted_detections.append(detection_obj)

            # If we only need one detection for a new log entry
            if single_mode:
                break

        # Reset the random seed
        random.seed()

        return jsonify({"detections": formatted_detections})


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