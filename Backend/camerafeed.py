import cv2
from ultralytics import YOLO
from collections import deque
import time
from flask import Flask, Response, jsonify
import threading
import signal
import sys
from datetime import datetime

app = Flask(__name__)

# variables
frame_buffer = None
detection_data = {
    "detected": False,
    "confidence": 0,
    "timestamp": "",
    "location": "Main Camera"
}
frame_lock = threading.Lock()
detection_lock = threading.Lock()
stop_event = threading.Event()

# Load YOLO model
model = YOLO("/home/hyemdanu/Lionfish/runs/detect/train/weights/best.pt")


def generate_frames():
    while not stop_event.is_set():
        global frame_buffer
        with frame_lock:
            if frame_buffer is not None:
                _, encoded_frame = cv2.imencode('.jpg', frame_buffer)
                frame_data = encoded_frame.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')
        time.sleep(0.03)  # ~30 FPS


def detection_thread():
    global frame_buffer, detection_data

    # camera
    cap = cv2.VideoCapture(0)

    # get average of 15
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
                if smoothed_conf >= 67:
                    detected = True
                    print(f"✅ Confirmed Lionfish! Stable Confidence: {smoothed_conf:.2f}%")

                    # Update detection data if it's a new detection (5 sec delay)
                    if time.time() - last_detection_time > 5:
                        with detection_lock:
                            detection_data = {
                                "detected": True,
                                "confidence": round(smoothed_conf, 2),
                                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                "location": "Main Camera"
                            }
                        last_detection_time = time.time()

                    # draw boxes
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