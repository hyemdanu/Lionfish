#include <Servo.h>

Servo servo;
int ledPin = 13;
int motor = 9;
void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  servo.attach(motor);
  servo.write(0);
  int dart = 1;

}

void loop() {
  // put your main code here, to run repeatedly:

  
  if (Serial.available()>0){
    char command = Serial.read();
    if (command == '1'){ //if lionfish detected then turn on light for 3 seconds for now at least
      digitalWrite(ledPin, HIGH);
      
      
      
    } else if (command == '0'){
      digitalWrite(ledPin, LOW);
    }
    
    if (command == '2'){
      servo.write(180);
      delay(3000);
      servo.write(0);
      
    }
    
  }

}
