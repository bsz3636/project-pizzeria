import {select, templates} from '../settings.js';
import {app} from '../app.js';

class Home {
  constructor (element) {
    const thisHome = this;

    thisHome.render (element);
    thisHome.linking ();
    thisHome.carousel ();
  }

  render (element) {
    const thisHome = this;

    const generatedHTML = templates.homePage ();
    //console.log (generatedHTML);

    thisHome.dom = {};
    thisHome.dom.wrapper= element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
    thisHome.dom.order = document.querySelector(select.home.order);
    thisHome.dom.booking = document.querySelector(select.home.booking);
  }

  linking () {
    const thisHome = this;

    thisHome.dom.order.addEventListener('click', function(){
      app.activatePage('order');
    });

    thisHome.dom.booking.addEventListener('click', function(){
      app.activatePage('booking');
    });
  }

  carousel () {
    const thisHome = this;

    thisHome.elem = document.querySelector('.main-carousel');
    thisHome.flkty = new Flickity( thisHome.elem, {
      // options
      cellAlign: 'left',
      contain: true,
      prevNextButtons: false,
      wrapAround: true,
      autoPlay: 3000,
    });
  }
}

export default Home;