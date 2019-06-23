import { EventEmitter } from "events";

export class Clock {
  eventEmitter: EventEmitter;
  time: Date;
  constructor() {
    this.time = new Date();
    this.eventEmitter = new EventEmitter();
  }
  public getEmitter() {
    return this.eventEmitter;
  }

  public initialise() {
    setInterval(() => {
      this.checkForRaffleTime();
    }, 50000);
    return setInterval(() => {
      this.setTime();
      this.checkForLeet();
    }, 10000);
  }

  private checkForLeet() {
    if (this.time.getHours() === 13 && this.time.getMinutes() === 37) {
      this.eventEmitter.emit("lenny", () => {
        return { time: this.time };
      });
    }
  }

  private checkForRaffleTime() {
    if (this.time.getDay() === 0 && this.time.getHours() === 20 && this.time.getMinutes() === 15) {
      this.eventEmitter.emit("raffleTime", () => {
        return { time: this.time };
      });
    } else if (this.time.getHours() % 13 === 0 && this.time.getMinutes() === 40) {
      this.eventEmitter.emit("raffleReminder", () => {
        return { time: this.time };
      });
    }
  }

  private setTime() {
    this.time = new Date();
  }
}
