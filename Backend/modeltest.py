import cv2
from ultralytics import YOLO
from collections import deque
import serial
import time

# Load YOLO model
model = YOLO("/home/minh/PycharmProjects/Lionfish/runs/train/lionfish_yolov11s/weights/best.pt")

# Open webcam
cap = cv2.VideoCapture(0)

# Store last 15 confidence values for smoothing
confidence_history = deque(maxlen=15)

# Setting up serial communication with Arduino (change '/dev/ttyUSB0' to your port)
arduino = serial.Serial('/dev/ttyUSB0', 9600, timeout=1)
time.sleep(2)  # Wait for connection

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Run inference
    results = model(frame, verbose=False)

    detected = False  # Reset detected flag every frame
    current_confidences = []  # Store current frame's confidence values

    # Loop through detected objects
    for result in results:
        if result.boxes:
            for box in result.boxes:
                conf = box.conf[0].item() * 100  # Convert to percentage
                current_confidences.append(conf)

    # Calculate smoothed confidence
    if current_confidences:
        avg_conf = sum(current_confidences) / len(current_confidences)
        confidence_history.append(avg_conf)
    else:
        confidence_history.append(0)  # Append zero when no detection occurs

    smoothed_conf = sum(confidence_history) / len(confidence_history)

    # Check if the smoothed confidence is above 65%
    if smoothed_conf >= 65:
        detected = True
        print(f"Stable Confidence: {smoothed_conf:.2f}% - Lionfish Detected!")
        arduino.write(b'1')  # Send signal to turn on light
    else:
        detected = False  # Explicitly set detected to False
        print(f"Stable Confidence: {smoothed_conf:.2f}% - No Lionfish Detected")

    # Always send '0' when detected is False
    if not detected:
        arduino.write(b'0')  # Send signal to turn off light

    # Draw bounding boxes for detections
    for result in results:
        if result.boxes:
            for box in result.boxes:
                conf = box.conf[0].item() * 100
                if conf >= 50:  # Draw box if confidence is above 50%
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, f"{conf:.2f}%", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    cv2.imshow("Lionfish Detection", frame)

    # Press 'q' to quit the camera
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
arduino.close()
