'use strict';

const TODAY = new Date();

/**
 * オンロード
 */
window.onload = async () => {
  // システム日付をセット
  const todayEle = document.getElementById('today');
  todayEle.textContent = `- ${formatDate(TODAY)} -`;

  // 日本の祝日を取得
  const publicHolidays = await getPublicHolidays();
  if(publicHolidays === undefined) {
    return;
  }

  // 本日以降の日本の祝日の日付リスト抽出
  const futurePublicHolidays = Object.keys(publicHolidays).map(x => {
    const holiday = new Date(x);
    if(TODAY <= holiday) {
      // 取得時の時間が9時で設定されている為、0時に変更
      holiday.setHours(holiday.getHours() - 9);
      return holiday;
    }
  }).filter(x => x);

  // 当日休日判定
  if(isHoliday(futurePublicHolidays)) {
    handleDisplay(true);
    return;
  }

  // 直近の休日取得
  const nextHoliday = getNextHoliday(futurePublicHolidays);
  const nextHolidayEle = document.getElementById('nextHoliday');
  nextHolidayEle.textContent = formatDate(nextHoliday);

  // 休み前の業務終了時間を取得（nextHolidayは値渡し）
  const workEndDateTime = getWorkEndDateTime(new Date(nextHoliday.getTime()), 18, 0);

  setInterval(countdown, 1000, workEndDateTime);
  handleDisplay(false);
};

/**
 * 当日から次の休日までのカウントダウン
 * @param {Date} nextHoliday - 次の休日
 */
function countdown(nextHoliday) {
  // const now = new Date();
  const now = new Date(2023, 8, 6, new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

  // システム日時と次の休日前日の就業終了時間との差分をカウントダウンする
  const diffDaysEle = document.getElementById('days');
  const diffHoursEle = document.getElementById('hours');
  const diffMinutesEle = document.getElementById('minutes');
  const diffSecondsEle = document.getElementById('seconds');

  const diff = calculateDatetimeDiff(now, nextHoliday);

  diffDaysEle.textContent = `${diff.days}日`;
  diffHoursEle.textContent = `${diff.hours.toString().padStart(2, 0)}時間`;
  diffMinutesEle.textContent = `${diff.minutes.toString().padStart(2, 0)}分`;
  diffSecondsEle.textContent = `${diff.seconds.toString().padStart(2, 0)}秒`;
}

/**
 * 日付フォーマット（yyyy/MM/dd）
 * @param {Date} date - 日付
 * @returns {string} - yyyy/MM/dd形式の日付文字列
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}/${month.toString().padStart(2, 0)}/${day.toString().padStart(2, 0)}`;
}

/**
 * 2つの日付の差分算出
 * @param {Date} sourceDatetime - 基準日
 * @param {Date} targetDatetime - 対象日
 * @returns {Object} - 差分オブジェクト（日/時/分/秒）
 */
function calculateDatetimeDiff(sourceDatetime, targetDatetime) {
  const diff = targetDatetime - sourceDatetime > 0 ? targetDatetime - sourceDatetime : 0;

  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;

  return {
    days: Math.floor(diff / day),
    hours: Math.floor((diff % day) / hour),
    minutes: Math.floor((diff % hour) / minute),
    seconds: Math.floor((diff % minute) / second)
  }
}

/**
 * 日本の祝日取得処理
 * @returns {Object} - {key:日付 value: 祝日名}
 * @see - 日本の祝日をAPIで取得する。
 */
async function getPublicHolidays() {
  const url = 'https://holidays-jp.github.io/api/v1/date.json';
  const errorMessage = '通信エラーが発生しました。¥nしばらく経ってから再度画面を再読み込みしてください。';

  const publicHolidays = await fetch(url)
    .then((response) => response.json())
    .then((data) => data)
    .catch((_) => alert(errorMessage));

  return publicHolidays;
}

/**
 * 休日判定チェック
 * @param {Date} publicHolidays - 祝日リスト
 * @returns {boolean} - true: 休日/false: 平日
 */
function isHoliday(publicHolidays){
  // 本日が祝日かチェック
  if(publicHolidays.map(x => formatDate(x)).includes(formatDate(TODAY))) {
    return true;
  }

  // 本日が土曜または日曜かチェック
  const day = TODAY.getDay();
  if(day === 6 || day === 0) {
    return true;
  }

  return false;
}

/**
 *　次の休日取得
 * @param {Date} publicHolidays - 休日リスト
 * @returns {Date} - 次の休日
 */
function getNextHoliday(publicHolidays) {
  // 次の土曜日を取得する（土曜日はgetDay()の6）
  const nextSaturday = TODAY.setDate(TODAY.getDate() + (6 - TODAY.getDay()));
  // 次の土曜日と祝日の中からより近い方を返す
  const nextHoliday = new Date(Math.min(...publicHolidays, nextSaturday));
  return nextHoliday;
}

/**
 * 次の休日前日の就業終了日時を取得
 * @param {Date} nextHoliday - 次の休日
 * @param {number} [endHour=18] -　就業終了時間（時）
 * @param {number} [endMinute=0] - 就業終了時間（分）
 * @returns {Date} - 次の休日前の就業終了日時
 */
function getWorkEndDateTime(nextHoliday, endHour = 18, endMinute = 0) {
  const workEndDateTime = new Date(nextHoliday.setHours(nextHoliday.getHours() - (24 - endHour)));
  workEndDateTime.setMinutes(nextHoliday.getMinutes() + endMinute);
  return workEndDateTime;
}

/**
 * 画面表示制御
 * @param {boolean} isHoliday - 休日判定
 */
function handleDisplay(isHoliday) {
  const countdownEle = document.getElementById('countdown');
  const holidayEle = document.getElementById('holiday');
  countdownEle.style.display = isHoliday ? 'none' : 'flex';
  holidayEle.style.display = isHoliday ? 'block' : 'none';
}
