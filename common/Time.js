'use strict';

const moment = require('moment');

class Time {
  // NOTE: Time utils begins.
  static startOfCurrentWeekMillis() {
    return 1000 * moment().startOf('week').unix();
  }

  static currentMillis() {
    const currentMomentObj = moment();
    return 1000 * currentMomentObj.unix() + currentMomentObj.milliseconds();
  }

  static currentMomentObj() {
    return moment();
  }

  static gmtMiilisecToLocalYmdhis(millis) {
    return moment(millis).format("YYYY-MM-DD HH:mm:ss");
  }

  static gmtMiilisecToLocalYmdhi(millis) {
    return moment(millis).format("YYYY-MM-DD HH:mm");
  }

  static gmtMiilisecToLocalYmd(millis) {
    return moment(millis).format("YYYY-MM-DD");
  }

  static localYmdhisToGmtMillisec(dateStr) {
    return 1000 * moment(dateStr, "YYYY-MM-DD HH:mm:ss").unix();
  }

  static localYmdToGmtMillisec(dateStr) {
    return 1000 * moment(dateStr, "YYYY-MM-DD").unix();
  }

  static momentObjToGmtMillis(obj) {
    return 1000 * obj.unix();
  }

  static momentObjToLocalYmd(obj) {
    return obj.format("YYYY-MM-DD");
  }

  static separateHisValuesToHisStr(hours, minutes, seconds) {
    function pad(num, size) {
      var s = num.toString();
      while (s.length < size) s = "0" + s;
      return s;
    }
    return pad(hours, 2) + " : " + pad(minutes, 2) + " : " + pad(seconds, 2);
  }

  static gmtMillisToMomentObj(millis) {
    return moment(millis);
  }

  static gmtMillisOfYmdStart(dateStr) {
    return 1000 * moment(dateStr + " 00:00:00", "").unix();
  }

  static gmtMillisOfYmdLastSecond(dateStr) {
    return 1000 * moment(dateStr + " 23:59:59", "").unix();
  }

  static beginningOfDayMomentObjTranslate(obj) {
    obj.hour(0);
    obj.minute(0);
    obj.second(0);
    obj.millisecond(0);
    return obj;
  }

  static lastSecOfDayMomentObjTranslate(obj) {
    obj.hour(23);
    obj.minute(59);
    obj.second(59);
    obj.millisecond(0);
    return obj;
  }

  static targetMillisToDurationFromNow(millis) {
    const targetMomentObj = moment(parseInt(millis));
    const currentMomentObj = moment();
    const tDiff = targetMomentObj.diff(currentMomentObj);
    const tDuration = moment.duration(tDiff);
    return {
      days: tDuration.days(),
      hours: tDuration.hours(),
      minutes: tDuration.minutes(),
      seconds: tDuration.seconds(),
      millis: tDuration.milliseconds(),
    };
  }

  static oneDayEarlierMomentObj(obj) {
    obj.subtract(1, 'days');
    return obj;
  }

// NOTE: Time utils ends.
}

// Use "CommonJs `require`" syntax to import for both NodeJsBackend and React16Frontend to guarantee compatibility.
exports.default = Time;
