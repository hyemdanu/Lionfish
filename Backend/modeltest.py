import cv2
from ultralytics import YOLO
from collections import deque
import serial
import time

# load model // change the username / path accordingly
model = YOLO("/home/hyemdanu/Lionfish/runs/detect/train/weights/best.pt")

# open webcam
cap = cv2.VideoCapture(0)

# store last 15 confidence for more accuracy
confidence_history = deque(maxlen=15)

# setting up serial communication with arduino (change 'COM3' to your specific usb port)
# arduino = serial.Serial('COM3', 9600, timeout=1)
# time.sleep(2)  # wait for connection

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # run inference
    results = model(frame, verbose=False)

    detected = False  # flag if confidence for lionfish
    current_confidences = []  # array for current confidence

    # First, collect all confidences without drawing boxes
    for result in results:
        if result.boxes:  # If any detections exist
            for box in result.boxes:
                conf = box.conf[0].item() * 100
                current_confidences.append(conf)

    # calculate confidences
    if current_confidences:
        avg_conf = sum(current_confidences) / len(current_confidences)
        confidence_history.append(avg_conf)

        smoothed_conf = sum(confidence_history) / len(confidence_history)

        # check for 65 smoothed confidence
        if smoothed_conf >= 65:
            detected = True
            print(f"✅ Confirmed Lionfish! Stable Confidence: {smoothed_conf:.2f}%")
            # arduino.write(b'1') # send signal to arduino

            for result in results:
                if result.boxes:
                    for box in result.boxes:
                        conf = box.conf[0].item() * 100
                        if conf >= 50:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                            cv2.putText(frame, f"{conf:.2f}%", (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    cv2.imshow("Lionfish Detection", frame)

    # press q to quit the camera
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
# arduino.close()