import cv2
from ultralytics import YOLO
from collections import deque
import time
from flask import Flask, Response, jsonify, send_file
import threading
import signal
import sys
from datetime import datetime
import os
import uuid

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

# Load YOLO model
model = YOLO("/home/hyemdanu/Lionfish/runs/train/lionfish_yolov11s/weights/best.pt")


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

            # calculate smoothed conifidence
            if current_confidences:
                avg_conf = sum(current_confidences) / len(current_confidences)
                confidence_history.append(avg_conf)

                smoothed_conf = sum(confidence_history) / len(confidence_history)

                # Only draw boxes if smoothed confidence is high enough
                if smoothed_conf >= 60:
                    detected = True

                    # if its new detection
                    if time.time() - last_detection_time > 5:
                        # Generate a unique ID for this detection image
                        image_id = str(uuid.uuid4())
                        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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
                                "location": "Main Camera",
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

            # update frame
            with frame_lock:
                frame_buffer = frame.copy()
    finally:
        cap.release()
        print("Camera released")


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