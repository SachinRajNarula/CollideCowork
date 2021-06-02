/* A view with a simple list
----------------------------------------------------------------------------------------------------------------------*/
var FC = $.fullCalendar; // a reference to FullCalendar's root namespace
var View = FC.View;      // the class that all views must inherit from
var defaultInterval = moment.duration(6, 'months');;
function ListView(calendar) {
    View.call(this, calendar); // call the super-constructor
}


ListView = View.extend(ListView.prototype, {

    name: 'list',


    incrementDate: function(date, delta) {
        var out = date.clone().stripTime().add(delta, 'days'); //imitated week view
        out = this.skipHiddenDays(out, delta < 0 ? -1 : 1);
        return out;
    },

    renderSelection: function(range) {
        alert();
    },

    render: function(date) {

        
        this.intervalStart = this.start.clone().stripTime();
        this.intervalEnd = this.intervalStart.clone().add(this.calendar.options.listInterval || defaultInterval, 'days');

        this.start = this.skipHiddenDays(this.intervalStart);
        this.end = this.skipHiddenDays(this.intervalEnd, -1, true);
        this.title = '';
        //this.title = FC.formatRange(
        //    this.start,
        //    this.end.clone().add(this.calendar.options.listInterval || defaultInterval, 'days').subtract(1), // make inclusive by subtracting 1 ms? why?
        //    "DD MMM",
        //    ' \u2014 ' // emphasized dash
        //);

        this.trigger('viewRender', this, this, this.el);

        // attach handlers to document. do it here to allow for destroy/rerender
        $(document)
            .on('mousedown', this.documentMousedownProxy)
            .on('dragstart', this.documentDragStartProxy); // jqui drag

    },

    renderEvents: function renderListEvents(events) {

        var noDebug = true;
        noDebug || console.log(events);

        var eventsCopy = events.slice().reverse(); //copy and reverse so we can modify while looping

        var tbody = $('<tbody></tbody>');

        this.scrollerEl = $('<div class="fc-scroller"></div>');

        this.el.html('')
            .append(this.scrollerEl).children()
            .append('<table style="border: 0; width:100%"></table>').children()
            .append(tbody);

        var periodEnd = this.end.clone().add(this.calendar.options.listInterval || defaultInterval, 'days');

        noDebug || console.log('Period start: ' + this.start.format("YYYY MM DD HH:mm:ss Z") + ', and end: ' + this.end.format("YYYY MM DD HH:mm:ss Z"));

        var currentDayStart = this.start.clone();
        while (currentDayStart.isBefore(periodEnd)) {

            var didAddDayHeader = false;
            var currentDayEnd = currentDayStart.clone().add(1, 'days');

            noDebug || console.log('=== this day start: ' + currentDayStart.format("YYYY MM DD HH:mm:ss Z") + ', and end: ' + currentDayEnd.format("YYYY MM DD HH:mm:ss Z"));

            //Assume events were ordered descending originally (notice we reversed them)
            for (var i = eventsCopy.length - 1; i >= 0; --i) {
                var e = eventsCopy[i];

                var eventStart = e.start.clone();
                var eventEnd = this.calendar.getEventEnd(e);

                if (!noDebug) {
                    console.log(e.title);
                    console.log('event index: ' + (events.length - i - 1) + ', and in copy: ' + i);
                    console.log('event start: ' + eventStart.format("YYYY MM DD HH:mm:ss Z"));
                    console.log('event end: ' + this.calendar.getEventEnd(e).format("YYYY MM DD HH:mm:ss Z"));
                    console.log('currentDayEnd: ' + currentDayEnd.format("YYYY MM DD HH:mm:ss Z"));
                    console.log(currentDayEnd.isAfter(eventStart));
                }

                if (currentDayStart.isAfter(eventEnd) || (currentDayStart.isSame(eventEnd) && !eventStart.isSame(eventEnd)) || periodEnd.isBefore(eventStart)) {
                    eventsCopy.splice(i, 1);
                    noDebug || console.log("--- Removed the above event");
                } else if (currentDayEnd.isAfter(eventStart)) {
                    //We found an event to display

                    noDebug || console.log("+++ We added the above event");

                    if (!didAddDayHeader) {
                        tbody.append('\
                                <tr>\
                                    <th colspan="4">\
                                        <span class="fc-header-day">' + currentDayStart.format(this.opt('dayPopoverFormat')) + '</span>\
                                        <span class="fc-header-date">' + '</span>\
                                    </th>\
                                </tr>');

                        didAddDayHeader = true;
                    }

                    var segEl = $('\
                        <tr class="fc-row fc-event-container fc-content" style="cursor: pointer">\
                            <td class="fc-event-handle">\
                                <span class="fc-event" style="background-color: ' + e.color + '"></span>\
                            </td>\
                            <td class="fc-time">' + (e.allDay ? this.opt('allDayText') : e.start.format(this.opt('smallTimeFormat')) + (e.end ? ' - ' + e.end.format(this.opt('smallTimeFormat')) : '')) + '</td>\
                            <td class="fc-title">' + e.title + '</td>\
                            <td class="fc-location">' + e.location || '' + '</td>\
                        </tr>');
                    tbody.append(segEl);

                    //Tried to use fullcalendar code for this stuff but to no avail
                    (function(_this, myEvent, mySegEl) { //temp bug fix because 'e' seems to change
                        segEl.on('click', function(ev) {
                            return _this.trigger('eventClick', mySegEl, myEvent, ev);
                        });
                    })(this, e, segEl);

                }

            }

            currentDayStart.add(1, 'days');
        }

        this.updateHeight();
        
    },

    updateWidth: function() {
        this.scrollerEl = $('<div class="fc-scroller"></div>');
        this.scrollerEl.width(this.el.width());
    },

    setHeight: function(height, isAuto) {
        this.scrollerEl = $('<div class="fc-scroller"></div>');
        var diff = this.el.outerHeight() - this.scrollerEl.height();

        this.scrollerEl.height(height - diff);

        var contentHeight = 0;
        this.scrollerEl.children().each(function(index, child) {
            contentHeight += $(child).outerHeight();
        });


        if (height - diff > contentHeight) {
            this.scrollerEl.css('overflow-y', 'hidden');
        }
        else {
            this.scrollerEl.css('overflow-y', 'scroll');
        }

    },

    getSegs: function() {
        return this.segs || [];
    },

    


});
FC.views.list = ListView; // register this view