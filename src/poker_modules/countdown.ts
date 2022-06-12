const TIME_OUT: number = 15;

class CountDown {
  private isPaused: boolean = false;

  private timeLeft: number = TIME_OUT;

  private intervalId: ReturnType<typeof setInterval>;

  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly onTimeout: Function, private readonly emitTime: Function,
  ) {
    this.intervalId = setInterval(this.updateClock, 1000);
  }

  private updateClock = () => {
    if (!this.isPaused) {
      this.timeLeft -= 1;
      if (this.timeLeft < 0) {
        clearInterval(this.intervalId);
        this.onTimeout();
      } else {
        this.emitTime(this.timeLeft);
      }
    }
  }

  getIsPaused() {
    return this.isPaused;
  }

  pauseClock() {
    if (!this.isPaused) {
      this.isPaused = true;
      clearInterval(this.intervalId);
    }
  }

  resumeClock() {
    if (this.isPaused) {
      this.isPaused = false;
      if (this.timeLeft < 0) return;
      this.intervalId = setInterval(this.updateClock, 1000);
    }
  }
}

export default CountDown;
