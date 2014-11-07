// ==UserScript==
// @name        AVClub TV Ratings
// @namespace   avclubtvratings
// @include     http://www.avclub.com/tvclub/*
// @include     http://www.avclub.com/tv/*
// @version     1
// @grant       none
// ==/UserScript==

(function ($) {
  var letters = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
      ratings = [],
      promises = [];

  function goToShowPage() {
    var href = $('.article-body .series:first').attr('href');

    $.get(href, function (resp) {
      getData(resp);
    });
  }

  function getData(body) {
    var $seasons = $(body).find('a[class*="season-"]');

    $seasons.each(function () {
      var $this = $(this),
          season = +$this.text(),
          href = $this.attr('href'),
          ratingData = {
            season: season,
            ratings: [],
            total: 0,
            num: 0
          },
          def = $.get(href, function (resp) {
            var $html = $(resp),
                $grades = $html.find('.article-list .grade');

            $grades.each(function () {
              var grade = $(this).text(),
                  value = letters.indexOf(grade);

              ratingData.ratings.unshift(value);
              ratingData.total += value;
              ratingData.num++;
              ratingData.average = ratingData.total / ratingData.num;
              ratingData.avgGrade = letters[Math.round(ratingData.average)];
            });
            
            ratings.push(ratingData);
          });

      promises.push(def);
    });

    $.when.apply(undefined, promises).done(summarize);
  }

  function summarize() {
    var summary = {
      season: 'All',
    };

    summary.total = ratings.reduce(function (p, c) {
      return (p.total || p) + c.total;
    });
    summary.num = ratings.reduce(function (p, c) {
      return (p.num || p) + c.num;
    });
    summary.average = summary.total / summary.num;
    summary.avgGrade = letters[Math.round(summary.average)];

    ratings.sort(function(a, b) {
      return a.season - b.season;
    });

    if (ratings.length > 1) {
      ratings.push(summary);
    }

    console.log('*** Ratings Summary Start ***');
    console.table(ratings);
    console.log('**** Ratings Summary End ****');

    appendTable();
  }

  function appendTable() {
    var $table = $('<table class="table"><caption style="background: #fff;">Show Summary</caption><thead><tr></tr></thead><tbody><tr></tr></tbody></table>');

    $table.css({
      position: 'fixed',
      bottom: 0,
      right: 0,
      minWidth: 120,
      textAlign: 'center',
      background: '#fff',
      zIndex: 100
    });

    for (var i = 0, l = ratings.length; i < l; i++) {
      var $season = $('<th>' + ratings[i].season + '</th>'),
          $avgGrade = $('<td>' + ratings[i].avgGrade + '</td>');

      $season.css('width', '30px');

      $table.find('thead tr').append($season);
      $table.find('tbody tr').append($avgGrade);
    }

    $('body').append($table);
  }

  $(document).ready(function () {
    goToShowPage(); 
  });
}(window.jQuery));