import {select, templates, classNames} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data){
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

  }

  renderInMenu(){
    const thisProduct = this;

    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);

    /* create element using utils.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML (generatedHTML);

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;
    
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    //console.log('form: ',this.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    //console.log('formInputs: ',this.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    //console.log('cartButton: ',this.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    //console.log('priceElem: ', this.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    //console.log('imageWrapper: ',this.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    //console.log('amountWidgetElem: ',thisProduct.amountWidgetElem);
  }

  initAccordion(){
    const thisProduct = this;
      
    /*find the clickable trigger (the element that should react to clicking)*/
    //const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    //console.log('clickableTrigger: ',clickableTrigger);
    /*STRAT: add enent listener to clickable trigger on event click*/
    thisProduct.accordionTrigger.addEventListener('click', function(event) {

      /*prevent default action for event*/
      event.preventDefault();

      /*find active product (product that has active class) */
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      //console.log('activeProduct',activeProduct);
        
      /*if there is active product and it's not thisProduct.element, remove class active from it */
      if(activeProduct && activeProduct != thisProduct.element){
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        /*toggle active class on thisProduct.element */
      } 
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }
  

  initOrderForm (){
    const thisProduct = this;
      
    
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
    
    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    
    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
      
  }
  

  processOrder(){
    const thisProduct = this;

    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    //console.log('formData', formData);
      
    // set price to default price
    let price = thisProduct.data.price;

    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      //console.log('parm: ',paramId, param);

      // for every option in this category
      for(let optionId in param.options) {
      
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        //console.log('option:' ,optionId, option);
        // check if there is param with a name of paramId in formData and if it includes optionId
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if(optionSelected) {
          // check if the option is not default
          if(!option.default===true ) {
            // add option price to price variable
            price+=option.price;
          }
        } else {
          // check if the option is default
          if(!option.default===false) {
            // reduce price variable
            price-=option.price;
          }
        }
        /*find image Znalezienie obrazka o klasie .paramId-optionId w divie z obrazkami.*/
        const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
        //console.log('optionImage: ',optionImage);
        if (optionImage) {
          if(optionSelected){
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          } else {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
        //thisProduct.imageWrapper = thisProduct.element.querySelector (select.menuProduct.imageWrapper);
        // console.log('imageWrapper: ',this.imageWrapper);
      }
    }

      

    /*multiply price by amount */
    price *= thisProduct.amountWidget.value;

    // update calculated price in the HTML
      
      
    thisProduct.priceElem.innerHTML = price;
    thisProduct.priceSingle = price;
  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

    thisProduct.amountWidgetElem.addEventListener('updated',function(){
      thisProduct.processOrder();
    });
  }

  addToCart(){
    const thisProduct = this;
    
    //app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart',{
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });
    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {};

    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = productSummary.priceSingle * productSummary.amount;
      
    productSummary.params = {};

    productSummary.params = thisProduct.prepareCartProductParams();

    return productSummary;
    //console.log('productSummary: ',productSummary);
  }

  prepareCartProductParams(){
    const thisProduct = this;

    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};
    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      //create category param in params const eg. params = { igredients: {name: 'Ingredients', options: {}}}
      params[paramId] = {
        label: param.label,
        options: {}
      };
      // for every option in this category
      for(let optionId in param.options) {
      
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        //console.log('option:' ,optionId, option);
        // check if there is param with a name of paramId in formData and if it includes optionId
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        //console.log('optionSelected: ',optionSelected);
        if(optionSelected) {
          // option is selected!
          params[paramId].options[optionId] = option.label;   
        }
      }
      //console.log('params: ',params);
    }
    return params;
  }
}

export default Product;