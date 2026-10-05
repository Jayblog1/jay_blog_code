(function () {
  var WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function buildClock() {
    var aside = document.getElementById('aside-content');
    if (!aside || document.getElementById('clock-card')) return;

    var card = document.createElement('div');
    card.id = 'clock-card';
    card.className = 'card-widget card-clock';
    card.innerHTML =
      '<div class="item-headline"><i class="far fa-clock"></i><span>时钟</span></div>' +
      '<div class="clock-time">--:--:--</div>' +
      '<div class="clock-date"></div>';
    aside.appendChild(card);

    var timeEl = card.querySelector('.clock-time');
    var dateEl = card.querySelector('.clock-date');

    function tick() {
      var d = new Date();
      timeEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      dateEl.textContent =
        d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 ' + WEEK[d.getDay()];
    }

    tick();
    setInterval(tick, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildClock);
  } else {
    buildClock();
  }
})();
