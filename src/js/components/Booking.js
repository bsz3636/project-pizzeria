import {templates, select, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';


class Booking {
  constructor(element){
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      bookings: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    //console.log('getData params: ', params );
    
    const urls = {
      bookings:      settings.db.url + '/' + settings.db.bookings 
                                     + '?' + params.bookings.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events   
                                     + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.events   
                                     + '?' + params.eventsRepeat.join('&'),
    };
    //console.log('getData urls:', urls);

    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then (function(allResponse){
        const bookingsResponse = allResponse[0];
        const eventsCurrentResponse = allResponse[1];
        const eventsRepeatResponse = allResponse[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        //console.log('bookings: ', bookings);
        //console.log('eventsCurrent: ', eventsCurrent);
        //console.log('eventsRepeat: ', eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate<= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    //nsole.log('thisBooking.booked:',thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock +=0.5){

      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (table.classList.contains(classNames.booking.tableSelected)) {
        table.classList.remove(classNames.booking.tableSelected);
      }

      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) 
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  initTables(){
    const thisBooking = this;

    const clickedElement = event.target;
    const clickTable = clickedElement.classList.contains(classNames.booking.table);
    const tableBooked = clickedElement.classList.contains(classNames.booking.tableBooked);
    const tableSelected = clickedElement.classList.contains(classNames.booking.tableSelected);

    if (clickTable && !tableBooked){
      if (tableSelected){
        clickedElement.classList.remove(classNames.booking.tableSelected);
      } else {
        clickedElement.classList.add(classNames.booking.tableSelected);
        const tableId = event.target.getAttribute(settings.booking.tableIdAttribute);
        thisBooking.selectedTable = tableId;
        
        //console.log('thisBooking.selectedTable1: ',thisBooking.selectedTable);

        
      }
    } else if (clickedElement.classList.contains(classNames.booking.table)
    && clickedElement.classList.contains(classNames.booking.tableBooked)){
      alert('Ten stolik jest już zarezerwowany w tym terminie! Wybierz inny.');
    }

    for(let table of thisBooking.dom.tables){
      if(table !== clickedElement){
        table.classList.remove(classNames.booking.tableSelected);
      } 
      if (clickedElement == classNames.booking.tableSelected){table.classList.remove(classNames.booking.tableSelected);
      }
    }
  }

  

  render(element){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = element.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = element.querySelector(select.widgets.hourPicker.wrapper);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

    thisBooking.dom.floorPlan = element.querySelector(select.booking.floorPlan);

    thisBooking.dom.form = element.querySelector(select.booking.form);
    thisBooking.dom.phone = thisBooking.dom.form.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.form.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.form.querySelectorAll(select.booking.starters);

    
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget (thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget (thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker (thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker (thisBooking.dom.hourPicker); 

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function(){
      thisBooking.initTables();
    });
    thisBooking.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
    
  }

  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;
    //console.log(url);

    for (let table of thisBooking.dom.tables){
      if(table.classList.contains('selected')){
        table = table.getAttribute('data-table');
      }
    }
      
    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: thisBooking.selectedTable,
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: [],
      address: thisBooking.dom.address.value,
      phone: thisBooking.dom.phone.value,
    };

    for (let starter of thisBooking.dom.starters){
      if (starter.checked == true){
        payload.starters.push(starter.value);
      }
    }
    //console.log('payload: ',payload);
   
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function(){
        thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);        
      });
  
    //console.log('url, options: ', url, options);
  }
}

export default Booking;