const uidUser = localStorage.getItem("uid");
const checkID = /^[a-f0-9]{24}$/;
let element_specific_req_number=0; //Serve per l'id durante la creazione di un nuovo campo per aggiungere una carta specifica
let element_specific_off_number=0;
let duplicate_cards = [];
let offset = -1;


function authAccess(){

    if(!checkID.test(uidUser)){
        alert("Unauthorized access");
        return false;   
    }
    return true;
}

async function getInformations(){
    if(!authAccess()){
        logout();

    } else{
        document.getElementById('waiting').classList.remove('d-none');

        await getMyOffers();
        await getMyDeals();
        await getTrades();

        
        document.getElementById('waiting').classList.add('d-none');
        document.getElementById("menu").classList.add("z-1");

    }
}

function addRequestSpecific(){
    
    let menu_specific_req = document.getElementById('specific_request');
    element_specific_req_number++;

    menu_specific_req.innerHTML += 
    `
    <div class="col-10 mt-2 " id='element_req_${element_specific_req_number}'>
                <a  class="form-outline  form-select text-decoration-none req_hero" id="hero_button_${element_specific_req_number}" onclick="handleSelectHeros('hero_button_${element_specific_req_number}','heros_menu_${element_specific_req_number}')" >
                  Select a card (hero) 
                </a> 
                <input type='numer' class='d-none' id='req_card_id'>
                <div class="list-group d-none" id="heros_menu_${element_specific_req_number}"> 
                  <div class="input-group mb-0 ">
                    <input type="text" class="form-control rounded-0" placeholder="Search..."  id="hero_name_${element_specific_req_number}">
                    <div class="input-group-append">
                      <button class=" form-control  rounded-0 " type="button" onclick="findCard('heros_list_${element_specific_req_number}','hero_name_${element_specific_req_number}','loading_request_${element_specific_req_number}','loading_msg_${element_specific_req_number}','loading_img_${element_specific_req_number}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search " viewBox="0 0 16 16">
                          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <a class="list-group-item list-group-item-action text-center d-none py-0" id="loading_request_${element_specific_req_number}">
                    <img src="" alt="Loading..." class="custom-loading mt-3" id="loading_img_${element_specific_req_number}" style="height: 25px; width: 25px;">
                    <p class="mb-2" id="loading_msg_${element_specific_req_number}">Loading...</p>
                  </a>

                  <select class="form-select custom-rounded-bottom d-none" size="3" id="heros_list_${element_specific_req_number}" onclick="chooseHero('hero_button_${element_specific_req_number}', 'heros_list_${element_specific_req_number}','hero')">
                    
                  </select>

                </div>
              </div>
              
              <div class="col-lg-1 col-md-2 col-sm-2 col-2 mt-1 px-1 mt-2 " id='rem_req_button_${element_specific_req_number}'>
                <button type='button' onclick="remReqSpecific('element_req_${element_specific_req_number}', 'rem_req_button_${element_specific_req_number}',${false})"  class="btn d-flex justify-content-center custom-bg-black custom-btn-dark custom-font-light">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="20" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                    <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                  </svg>
                </button>
              </div>
    `;
}

function remReqSpecific(element_spec_req, remove_button){

   document.getElementById(element_spec_req).remove();
   document.getElementById(remove_button).remove();
}

function findCard(id_list, id_name_hero, id_loading, id_loading_msg, id_loading_img){

    const checkCharacters = /^\w[a-z1-9-_.:,,?/&%$*() ]*$/i;
    let list = document.getElementById(id_list);
    let name_hero = document.getElementById(id_name_hero).value;
    let loading_msg = document.getElementById(id_loading_msg);
    let loading_img = document.getElementById(id_loading_img);
    let loading_div = document.getElementById(id_loading);

    loading_div.classList.remove('d-none');

    loading_img.src="https://media.tenor.com/TAqs38FFJiwAAAAi/loading.gif";

    
    if(!authAccess()){
        logout();

    } else{
        if(name_hero!=null && name_hero!=undefined && checkCharacters.test(name_hero)){

            fetch(`http://localhost:3000/heros?nameStartWith=${name_hero}&id=true`)
            .then(response => response.json())
            .then(res =>{
    
                if(res.error){
                    loading_img.src="https://media.tenor.com/zQM6QTjo3FMAAAAi/ms-marvel-marvel-studios.gif"; //Immagine per ricerca fallita
                    loading_msg.innerText=res.msg;
    
                } else{
    
                    if(res.results.length<1){
                        loading_img.src="https://media.tenor.com/zQM6QTjo3FMAAAAi/ms-marvel-marvel-studios.gif";
                        loading_msg.innerText=res.innerText="Hero not found";
    
                    } else{
                        loading_div.classList.add('d-none');
                        list.classList.remove('d-none');
    
                        //Inizializzo la lista
                        list.innerHTML='';
    
                        res.results.forEach(element => {
                            list.innerHTML+=`<option value="${element.id}" id="hero_${element.id}">${element.name}</option>`;
                        });
                    }
                }
            });
        }
    }
 
}

function addOfferSpecific(){
    
    let menu_specific_off = document.getElementById('menu_specific_off');

    element_specific_off_number++;

    menu_specific_off.innerHTML+=`
    <div class="col-10 mt-2 " id='element_off_${element_specific_off_number}'>
                <a  class="form-outline  form-select text-decoration-none off_duplicate" name="" id="duplicates_button_${element_specific_off_number}" onclick="handleSelectHeros('duplicates_button_${element_specific_off_number}','duplicates_menu_${element_specific_off_number}')">
                  Select a hero
                </a> 
                <div class="list-group d-none" id="duplicates_menu_${element_specific_off_number}"> 
                  <div class="input-group mb-0 ">            
                    <select class="form-select custom-rounded-bottom " size="3" id="duplicates_list_${element_specific_off_number}" onclick="chooseDuplicate('duplicates_button_${element_specific_off_number}','duplicates_list_${element_specific_off_number}')">
                    </select>
                </div>
              </div>
    </div>
              
              <div class="col-lg-1 col-md-2 col-sm-2 col-2 mt-1 px-1 mt-2 " id='rem_off_button_${element_specific_off_number}'>
                <button type='button' onclick="remOffSpecific('element_off_${element_specific_off_number}', 'rem_off_button_${element_specific_off_number}','duplicates_button_${element_specific_off_number}')"  class="btn d-flex justify-content-center custom-bg-black custom-btn-dark custom-font-light">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="20" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                    <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                  </svg>
                </button>
              </div>   
    `;

    duplicate_cards.forEach(card => {
        if(card.quantity>0)
            document.getElementById(`duplicates_list_${element_specific_off_number}`).innerHTML+=`<option value="${card._id}">${card.name}</option>`;
    });
}

function remOffSpecific(element_spec_req, remove_button,id_button){

    let id = document.getElementById(id_button).name;
    let card = duplicate_cards.find(card => {return card.hero==id} );
    let index = duplicate_cards.indexOf(card);

    //Prima di eliminare la riga, aggiorno la quantità per rendere la carta di nuovo visibile durante la scelta
    //nel menu a tendina

    if(index>-1 && index!=null && index!=undefined)
        duplicate_cards[index].quantity=1;

    document.getElementById(element_spec_req).remove();
    document.getElementById(remove_button).remove();
}

function findDuplicates(){

    let loading_img = document.getElementById('loading_image_off');
    let loading_msg = document.getElementById('loading_msg_off');
    let loading_container = document.getElementById('loading_section_off');
    let plus_button = document.getElementById('off_plus');

    if(!authAccess()){
        logout();

    } else{

        plus_button.classList.add('d-none');
        loading_container.classList.remove('d-none');

        fetch(`http://localhost:3000/cards/info/${uidUser}?filter=duplicates`)
        .then(response => response.json())
        .then(res =>{

            loading_img.classList.add('d-none');

            if(res.error)
                loading_msg.innerText=res.msg;
            else{

                if(res.cards.length<1)
                    loading_msg.innerText='You have no double cards';
                else{
                    loading_container.classList.add('d-none');
                    plus_button.classList.remove('d-none');
                    duplicate_cards=res.cards;
                }
            }

        });
    }
}

//Questa funzione seleziona una carta (Eroe)
function chooseHero(id_button, id_select, id_first_part_hero){

    let heroButton = document.getElementById(id_button);
    let id = document.getElementById(id_select).value;

    heroButton.innerText = document.getElementById(`${id_first_part_hero}_${id}`).innerText;
    heroButton.name = id;
}

function chooseDuplicate(id_button, id_select){
    let selected_card = document.getElementById(id_select);
    let duplicateButton = document.getElementById(id_button);

    let card = duplicate_cards.find(card => {return card._id==selected_card.value;} );
    let index = duplicate_cards.indexOf(card);

    //Azzero la quantità per fare in modo che non esca più nel menu a tendina durante la scelta dei doppioni
    //Se la riga contenente questa carta verrà eliminata, allora verrà incrementato il valore della quantità
    //In questo modo faccio un primo controllo per evitare di mettere due carte uguali
    if(index>-1 && index!=null && index!=undefined){
        duplicate_cards[index].quantity=0;
        duplicateButton.name=duplicate_cards[index].hero;
        duplicateButton.innerText=duplicate_cards[index].name;
    }
}

function checkCreateOffer(){

     //Variabili del campo request
     let req_credits = document.getElementById('req_credits').value;
     let req_totalCards = document.getElementById('req_totalCards').value;
     let req_rarities = document.getElementsByClassName('req_rarities');
     let req_specifics = document.getElementsByClassName('req_hero'); //I valori sono contenuti nel campo name
     let error_list = document.getElementById('error_create_list');
     let error_row = document.getElementById('error_create_row');
 
     //Variabili del campo offer
     let off_credits = document.getElementById('off_credits').value;
     let off_specifics = document.getElementsByClassName('off_duplicate');
 
     let valid_req_input = false;
     let valid_off_input = false;
     let count_totalCards = 0;
     let error_msg = [];
 
     const checkNumbers = /^[1-9][0-9]*$/;
 
     error_row.classList.add('d-none');
 
     error_msg.push("<b>Invalid fields</b> "); //Questo messaggio verrà mostrato in ogni tipo di errore
 
     //Controlli request
 
     if(req_credits!=null && req_credits!=undefined && req_credits!='' && checkNumbers.test(req_credits))
         valid_req_input = true;
 
     
     //Faccio la somma di tutte le carte per ogni tipo richieste (generic cards)
     for(let i=0;i<req_rarities.length;i++){
         if(checkNumbers.test(req_rarities[i].value))
             count_totalCards+=parseInt(req_rarities[i].value);
     }
 
     if(count_totalCards>0 && !checkNumbers.test(req_totalCards)){
         error_msg.push("Invalid total cards number (request)");
         valid_req_input=false;
     }
 
     if(checkNumbers.test(req_totalCards)){
         if(count_totalCards!=parseInt(req_totalCards) ){
             error_msg.push("The total number of cards does not correspond to the number of cards per type (request)");
             valid_req_input=false;
         } else
             valid_req_input=true;
     }
 
     //Controllo che tutte le carte specifiche sia state scelte correttamente. Non appena
     //viene trovato un errore, il ciclo termina
     
     for(let i=0, flag_error=false;i<req_specifics.length && !flag_error;i++){
         if(!flag_error && (req_specifics[i].name=='' || req_specifics[i].name==undefined || req_specifics[i].name==null)){
                 error_msg.push("Choice of specific cards not complete (request)");
                 valid_req_input = false;
                 flag_error = true;
         } else
            valid_req_input = true;
     }

 
     //Controlli offer
 
     count_totalCards=0;
 
     if(off_credits!=null && off_credits!=undefined && off_credits!='' && checkNumbers.test(off_credits))
         valid_off_input = true;

     //Controllo che tutte le carte specifiche sia state scelte correttamente. Non appena
     //viene trovato un errore, il ciclo termina
     for(let i=0, flag_error=false;i<off_specifics.length && !flag_error;i++){
         if(!flag_error && (off_specifics[i].name=='' || off_specifics[i].name==undefined || off_specifics[i].name==null)){
                 error_msg.push("Choice of specific cards not complete (offer)");
                 valid_off_input = false;
                 flag_error=true;
         } else
            valid_off_input = true;
     } 

     if(!valid_req_input || !valid_off_input){
        error_row.classList.remove('d-none');

        error_list.innerHTML='';
        error_msg.forEach(element => {
            error_list.innerHTML+=`<li style="margin-left: 20px;">${element}</li>`
         });
     }
         
    return (valid_req_input && valid_off_input);
}

async function sendOffer(){

    let checkOffer = checkCreateOffer();
    let options;
    let req_specifics_card = document.getElementsByClassName('req_hero');
    let off_specifics_card = document.getElementsByClassName('off_duplicate');
    let req_specifics_card_send = [];
    let off_specifics_card_send = [];

    if(checkOffer){

        for(let i=0;i<req_specifics_card.length;i++)
            req_specifics_card_send.push(req_specifics_card[i].name);

        for(let i=0;i<off_specifics_card.length;i++)
            off_specifics_card_send.push(off_specifics_card[i].name)
    
        options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                uid:uidUser,
                request:{
                    credits: document.getElementById('req_credits').value,
                    totalCards: document.getElementById('req_totalCards').value,
                    rarities:{
                        legendary: document.getElementById('req_legendaries').value,
                        heroic: document.getElementById('req_heroics').value,
                        mythic: document.getElementById('req_mythics').value,
                        super: document.getElementById('req_super').value,
                        common: document.getElementById('req_commons').value
                    },
                    specifics:req_specifics_card_send
                },
                offer:{
                    credits: document.getElementById('off_credits').value,
                    specifics: off_specifics_card_send
                }
            })
        }

        document.getElementById('window_creates').classList.add('d-none');
        document.getElementById('waiting').classList.remove('d-none');

        await fetch(`http://localhost:3000/trades`,options)
        .then(response => response.json())
        .then(data => {

                document.getElementById('waiting').classList.add('d-none');
                document.getElementById("menu").classList.add("z-1");

            if(data.error){
                document.getElementById("window_error").classList.remove("d-none");

                let list = document.getElementById("msg_list");

            
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });

            } else{
                document.getElementById('window_success').classList.remove('d-none');
                document.getElementById('msg_success').innerText="";
                document.getElementById('msg_success').innerText="Offer successfully created";
            }
            
            })

    }

}

async function getTrades() {

    let offers_container = document.getElementById('offer_container');
    let offer;
    let request;
    
    if(!authAccess()){
        logout();

    } else{

        offset++;

        await fetch(`http://localhost:3000/trades/${uidUser}?offset=${offset}&trade=open`)
        .then(response => response.json())
        .then(data => {

            if(data.error){
                document.getElementById("window_error").classList.remove("d-none");

                let list = document.getElementById("msg_list");

            
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });

            } else {

                if(data.length<1 && offset==0){
                    offers_container.innerHTML=`<div class="d-flex justify-content-center mt-5">
                            <img src='https://media.tenor.com/PSRXwETjL10AAAAi/i-am-groot-marvel-studios.gif' style="width: 150px; height: 200px;">
                        </div>
                        <p class="d-flex justify-content-center mt-4"><b>There are currently no exchange requests, create one or...wait.</b></p>
                    `;
                }

                if(data.length<1)
                    document.getElementById('load_more_btn').classList.add('d-none');
                 else
                    data.forEach(element => {

                        if(element.seller.image==undefined || element.seller.image==null || element.seller.image=='')
                            element.seller['image']="https://static.vecteezy.com/system/resources/previews/001/840/618/original/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg";

                        request = '';

                        if(element.request.credits!=undefined && element.request.credits!='' && element.request.credits!=null)
                            request+=`<div class="m-0 text-center"><b>Credits</b>: ${element.request.credits}</div>`;
                        
                        Object.keys(element.request.rarities).forEach( key => {
                            if(element.request.rarities[key]!=undefined && element.request.rarities[key]!=null && element.request.rarities[key]!='' )
                                request+=`<div class="m-0 text-center"><b>${key}</b>: ${element.request.rarities[key]}</div>`;
                        });

                        Object.keys(element.request.specifics).forEach( key => {
                            if(element.request.specifics[key]!=undefined && element.request.specifics[key]!=null && element.request.specifics[key]!='' )
                                request+=`<div class="m-0 text-center"><b>Hero</b>: ${element.request.specifics[key].name}</div>`;
                        });

                        offer = '';

                        if(element.offer.credits!=undefined && element.offer.credits!='' && element.offer.credits!=null)
                            offer+=`<div class="m-0 text-center"><b>Credits</b>: ${element.offer.credits}</div>`;

                        Object.keys(element.offer.specifics).forEach( key => {
                            if(element.offer.specifics[key]!=undefined && element.offer.specifics[key]!=null && element.offer.specifics[key]!='' )
                                offer+=`<div class="m-0 text-center"><b>Hero</b>: ${element.offer.specifics[key].name}</div>`;
                        });

                        offers_container.innerHTML+=`
                                            <div class="col-lg-4 d-flex justify-content-center rounded">
                                
                                            <div class="row mt-4 container px-0 custom-bg-grey rounded">
                                                <div class="col-12 px-0">
                                                    <div class="${getColor()} d-flex justify-content-center rounded-top">
                                                        <img src=${element.seller.image} class=" img-fluid custom-img-profile mt-4 rounded-circle" alt="">
                                                    </div>
                                                </div>

                                            <div class="col-12 custom-bg-white d-flex justify-content-center  ">
                                                    <h6>@${element.seller.username}</h6>
                                            </div>

                                                    <div class="col-6 custom-bg-white d-flex justify-content-center ">
                                                    <h5 class="card-title ">Request:</h5>
                                                </div>

                                                <div class=" col-6 custom-bg-white d-flex justify-content-center ">
                                                    <h5 class="card-title">&nbsp &nbsp  Offer:</h5>
                                                </div>

                                                    <div class="col-6 custom-bg-white">
                                                            ${request}
                                                    </div>

                                                    <div class="col-6 custom-bg-white px-1">
                                                        <ul>
                                                            ${offer}
                                                        </ul>
                                                    </div>

                                                
                                                    <div class="col-12 custom-bg-white custom-rounded-r mt-3">
                                                        <a onclick='openDeal(${JSON.stringify(element)})' class="btn mb-3 d-flex justify-content-center custom-bg-black custom-btn-dark custom-font-light">Deal</a>
                                                    </div>

                                            </div>
                                    </div>`;
                    });
            
            }
        });

    }
}

function getColor(){

    //Scelgo casualmente un colore da mettere come sfondo per l'annuncio della richiesta
   //(E' un fattore puramente estetico)

   color =  Math.floor(Math.random() * 5);

   switch(color){
       
       case 0: return 'custom-bg-red-half';//rosso
       case 1: return'custom-bg-blue-half';  //blu
       case 2: return 'custom-bg-green-half'; //verde
       case 3: return 'custom-bg-pink-half'; //rosa
       case 4: return 'custom-bg-yellow-half'; //giallo
   }
}

async function getMyOffers() {

    let offer;
    let request;
    let offers_container = document.getElementById('Myoffer_container');


    if(!authAccess()){
        logout();

    } else{

        await fetch(`http://localhost:3000/trades/myOffers/${uidUser}?trade=open`)
        .then(response => response.json())
        .then(data => {
            if(data.error){
                document.getElementById("window_error").classList.remove("d-none");

                let list = document.getElementById("msg_list");

            
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });

            } else {

                data.forEach(element => {

                    if(element.seller.image==undefined || element.seller.image==null || element.seller.image=='')
                        element.seller['image']="https://static.vecteezy.com/system/resources/previews/001/840/618/original/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg";

                    request = '';

                    if(element.request.credits!=undefined && element.request.credits!='' && element.request.credits!=null)
                        request+=`<p class="m-0 text-center"><b>Credits</b>: ${element.request.credits}</p>`;
                    
                    Object.keys(element.request.rarities).forEach( key => {
                        if(element.request.rarities[key]!=undefined && element.request.rarities[key]!=null && element.request.rarities[key]!='' )
                            request+=`<p class="m-0 text-center"><b>${key}</b>: ${element.request.rarities[key]}</p>`;
                    });

                    Object.keys(element.request.specifics).forEach( key => {
                        if(element.request.specifics[key]!=undefined && element.request.specifics[key]!=null && element.request.specifics[key]!='' )
                            request+=`<p class="m-0 text-center"><b>Hero</b>: ${element.request.specifics[key].name}</p>`;
                    });

                    offer = '';

                    if(element.offer.credits!=undefined && element.offer.credits!='' && element.offer.credits!=null)
                        offer+=`<p class="m-0 text-center"><b>Credits</b>: ${element.offer.credits}</p>`;

                    Object.keys(element.offer.specifics).forEach( key => {
                        if(element.offer.specifics[key]!=undefined && element.offer.specifics[key]!=null && element.offer.specifics[key]!='' )
                            offer+=`<p class="m-0 text-center"><b>Hero</b>: ${element.offer.specifics[key].name}</p>`;
                    });

                    offers_container.innerHTML+=`
                                    <li class="list-group-item">
                                <div class="row">
                                    <div class="col-6 d-flex justify-content-center"><h6>Request:</h6></div>
                                    <div class="col-6 d-flex justify-content-center"><h6>Offer:</h6></div>
                                </div>
                                <div class="row">
                                    <div class="col-6 d-block justify-content-center">${request}</div>
                                    <div class="col-6 d-block justify-content-center">${offer}</div>
                                </div>
                                <div class="row d-flex justify-content-center">
                                    <div class="col-lg-2 col-md-3 col-sm-4 col-4"><a onclick="deleteOffer('${element._id}')" class="btn mb-3 d-flex justify-content-center custom-bg-black custom-btn-dark custom-font-light mt-2">Delete</a>
                                    </div>
                                </div>
                
                            </li>`

                });
            }
            
        });

    }
}

async function deleteOffer(id){

    let options = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    }

    await fetch(`http://localhost:3000/trades/myOffers/${uidUser}/${id}`,options)
    .then(response => response.json())
    .then(data => {

        document.getElementById("menu").classList.add("z-1");

        if(data.error){
            document.getElementById("window_error").classList.remove("d-none");
            document.getElementById("window_offers").classList.remove("d-none");

            let list = document.getElementById("msg_list");

        
            list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

            data.msg.forEach(element => {
                list.innerHTML+=`<li class="m-2">${element}</li>`;
            });

        } else 
            window.location.reload();
    });

}

function reloadPage(){
    window.location.reload();
}

async function openDeal(trade){

    let credits_input = document.getElementById('credits_input_deals');
    let title_credits = document.getElementById('label_credits_deals');
    let title_legendary = document.getElementById('label_legendary_deals');
    let title_heroic = document.getElementById('label_heroic_deals');
    let title_mythic = document.getElementById('label_mythic_deals');
    let title_super = document.getElementById('label_super_deals');
    let title_common = document.getElementById('label_common_deals');
    let title_specific = document.getElementById('label_specifics_deals');
    let fields = document.getElementsByClassName('deal_field');
    let select_container = document.getElementsByClassName('menu_deals');

    let keys_rarities;
    let flag_confirm = true; //Se un utente non ha tutti i requisiti richiesti per fare un deal, ne tengo traccia in questa flag
                      //In questo modo posso rendere visibile o meno il bottone di conferma
     
    const checkNumber = /[1-9][0-9]*/;

    document.getElementById('window_deals').classList.remove('d-none');
    document.getElementById('menu').classList.add('z-1');
    document.getElementById('confirm_button_deals_container').innerHTML='';
    document.getElementById('error_deals_row').classList.add('d-none');

    //Aggiungo a tutti i campi la classe d-none
    for(let i=0;i<fields.length;i++){
        fields[i].classList.add('d-none');
        fields[i].classList.remove('text-danger');
    }

    //Elimino tutti i nodi dei div che contengono i vari select
    for(let i=0; i<select_container.length;i++)
        select_container[i].innerHTML='';
    
    //Faccio comparire tutti i titoli delle cose richieste 
    if(checkNumber.test(trade.request.credits)){
        title_credits.classList.remove('d-none');
        credits_input.value=trade.request.credits;
    }

    //Prima faccio vedere tutti i campi necessari
    if(checkNumber.test(trade.request.rarities.legendary))
        title_legendary.classList.remove('d-none');

    if(checkNumber.test(trade.request.rarities.heroic))
        title_heroic.classList.remove('d-none');

    if(checkNumber.test(trade.request.rarities.mythic))
        title_mythic.classList.remove('d-none');

    if(checkNumber.test(trade.request.rarities.super))
        title_super.classList.remove('d-none');

    if(checkNumber.test(trade.request.rarities.common))
        title_common.classList.remove('d-none');

    if(trade.request.specifics.length>0){
        title_specific.classList.remove('d-none');

        document.getElementById('menu_deals_specifics').innerHTML='';

        trade.request.specifics.forEach(card => {
            document.getElementById('menu_deals_specifics').innerHTML+=`<li class="list-group-item" name="${card.id}">${card.name}</li>`;
        })
    }

    if(checkNumber.test(trade.request.rarities.legendary)|| checkNumber.test(trade.request.rarities.heroic)|| checkNumber.test(trade.request.rarities.mythic) || checkNumber.test(trade.request.rarities.super) || checkNumber.test(trade.request.rarities.common)){
        //Prendo tutte le chiavi (rarità) 
        keys_rarities = Object.keys(trade.request.rarities);
 
        //Ciclo le rarità richiestà sfruttando le chiavi
        //trade.request.rarities[keys_rarities[count_keys]]: in questo modo prendo in valore di ogni rarità es. legendary:3
        //keys_rarities[count_keys]: in questo modo prendo la rarità. Es. legendary
        for(let count_keys=0; count_keys<keys_rarities.length; count_keys++){
        
            if(checkNumber.test(trade.request.rarities[keys_rarities[count_keys]])){
                await fetch(`http://localhost:3000/cards/info/${uidUser}?filter=${keys_rarities[count_keys]}`)
                    .then(response => response.json())
                    .then(data => {

                        document.getElementById(`loading_image_deals_${keys_rarities[count_keys]}`).classList.add('d-none');

                        if(data.error){
                            document.getElementById(`loading_msg_deals_${keys_rarities[count_keys]}`).innerText=data.msg;
                            flag_confirm = false;
                        }

                        else{

                            if(data.cards.length<parseInt(trade.request.rarities[keys_rarities[count_keys]])){
                                document.getElementById(`loading_deals_${keys_rarities[count_keys]}`).classList.remove('d-none');
                                document.getElementById(`label_${keys_rarities[count_keys]}_deals`).classList.add('text-danger');
                                document.getElementById(`loading_msg_deals_${keys_rarities[count_keys]}`).innerText=`You do not have enough cards to exchange. You are missing ${parseInt(trade.request.rarities[keys_rarities[count_keys]])-data.cards.length}`;
                                flag_confirm = false;
                            }
                            else{
                                document.getElementById(`loading_deals_${keys_rarities[count_keys]}`).classList.add('d-none');

                                document.getElementById(`menu_deals_${keys_rarities[count_keys]}`).innerHTML='';
                            
                                for(let i=0, menu = document.getElementById(`menu_deals_${keys_rarities[count_keys]}`); i<trade.request.rarities[keys_rarities[count_keys]]; i++){
                                    menu.innerHTML+=`
                                    <div class="col-12 mt-2 " id='element_deals_${keys_rarities[count_keys]}_${i}'>
                                        <a  class="form-outline  form-select text-decoration-none deals_${keys_rarities[count_keys]}_name_id" name="" id="deals_${keys_rarities[count_keys]}_button_${i}" onclick="handleSelectHeros('deals_${keys_rarities[count_keys]}_button_${i}','deals_${keys_rarities[count_keys]}_menu_${i}')">
                                        Select a hero
                                        </a> 
                                        <div class="list-group d-none" id="deals_${keys_rarities[count_keys]}_menu_${i}"> 
                                        <div class="input-group mb-0 ">            
                                            <select class="form-select custom-rounded-bottom " size="3" id="deals_${keys_rarities[count_keys]}_list_${i}" onclick="chooseHero('deals_${keys_rarities[count_keys]}_button_${i}','deals_${keys_rarities[count_keys]}_list_${i}','deals_${keys_rarities[count_keys]}')">
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                `;
        
                                data.cards.forEach(card => {
        
                                    if(parseInt(card.quantity)>1)
                                        document.getElementById(`deals_${keys_rarities[count_keys]}_list_${i}`).innerHTML+=`<option value="${card.hero}" id='deals_${keys_rarities[count_keys]}_${card.hero}'>${card.name} | Duplicate card</option>`;
                                    else
                                        document.getElementById(`deals_${keys_rarities[count_keys]}_list_${i}`).innerHTML+=`<option value="${card.hero}" id='deals_${keys_rarities[count_keys]}_${card.hero}'>${card.name}</option>`;
                                });
                                }
                            
                            }
                        }

                    });
            }
        }
    }

    if(flag_confirm)
        document.getElementById('confirm_button_deals_container').innerHTML=
            `<a onclick="sendDeals('${trade._id}')" id="confirm_button_deals"  class="btn d-flex justify-content-center custom-bg-black custom-btn-dark custom-font-light float-end m-1 mb-0 ">
              Confirm
            </a>`;
    

}

function checkDeals(){

    //Faccio i controlli solo per i campi a scelta libera, come le carte generiche per rarità
    //I crediti e le carte specifiche sono già precompilate, e la loro corretta verrà controllata sul server
    //Per correttezza intendo che l'utente abbia i crediti necessari (e di conseguenza che i crediti siano di un formato numero)
    //e che le carte specifiche sianos possedute dall'utente

    let legendaries = document.getElementsByClassName('deals_legendary_name_id');
    let heroics = document.getElementsByClassName('deals_heroic_name_id');
    let mythics = document.getElementsByClassName('deals_mythic_name_id');
    let supers = document.getElementsByClassName('deals_super_name_id');
    let commons = document.getElementsByClassName('deals_common_name_id');

    let flag_rarities;
    let error_list = document.getElementById('error_deals_list');
    let valid = true;

    error_list.innerHTML = '';
    document.getElementById('error_deals_row').classList.add('d-none');

    if(legendaries!=undefined && legendaries!=null && legendaries.length>0){
        flag_rarities = checkRaritiesDeals(legendaries, 'legendary');

        if(!flag_rarities.valid){

            document.getElementById('error_deals_row').classList.remove('d-none');
            valid = false;

            flag_rarities.msg.forEach( msg => {
                error_list.innerHTML+=`<li style="margin-left: 20px;">${msg}</li>`
            });
        }
    }
    
    if(heroics!=undefined && heroics!=null && heroics.length>0){
        flag_rarities = checkRaritiesDeals(heroics, 'heroic');

        if(!flag_rarities.valid){

            document.getElementById('error_deals_row').classList.remove('d-none');
            valid = false;

            flag_rarities.msg.forEach( msg => {
                error_list.innerHTML+=`<li style="margin-left: 20px;">${msg}</li>`
            });
        }
    }
    

    if(mythics!=undefined && mythics!=null && mythics.length>0){
        flag_rarities = checkRaritiesDeals(mythics, 'mythic');

        if(!flag_rarities.valid){

            document.getElementById('error_deals_row').classList.remove('d-none');
            valid = false;

            flag_rarities.msg.forEach( msg => {
                error_list.innerHTML+=`<li style="margin-left: 20px;">${msg}</li>`
            });
        }
    }

    if(supers!=undefined && supers!=null && supers.length>0){
        flag_rarities = checkRaritiesDeals(supers, 'super');

        if(!flag_rarities.valid){

            document.getElementById('error_deals_row').classList.remove('d-none');
            valid = false;

            flag_rarities.msg.forEach( msg => {
                error_list.innerHTML+=`<li style="margin-left: 20px;">${msg}</li>`
            });
        }
    }

    if(commons!=undefined && commons!=null && commons.length>0){
        flag_rarities = checkRaritiesDeals(commons, 'common');

        if(!flag_rarities.valid){
            
            document.getElementById('error_deals_row').classList.remove('d-none');
            valid = false;

            flag_rarities.msg.forEach( msg => {
                error_list.innerHTML+=`<li style="margin-left: 20px;">${msg}</li>`
            });
        }
    }

    if(valid)
        return true;
    return false;

}

//Controllo che tutti i campi siano stati compilati e se ci sono dei doppioni
function checkRaritiesDeals(rarity, nameRarity){

    const checkIDNumber = /\d/;
    let valid = true;
    let duplicate = false;
    let IDs = [];
    let msg = [];

    if(rarity!=null && rarity!=undefined && rarity!=NaN){
        if(rarity.length>0){
            for(let i=0; i<rarity.length && valid; i++)
                if(!checkIDNumber.test(rarity[i].name))
                    valid=false;
                else                            //Altrimenti procedo a riempire un'array che contiene tutti gli id, questo mi servirà successivamente
                    IDs.push(rarity[i].name);
        } else
               valid = false;
    } else
            valid = false;


    //Dopo aver controllato che tutti i campi sono stati riempiti, controllo che l'utente non abbia selezionato 2 volte la stessa carta
        for(let i=0; i<IDs.length-1 && !duplicate; i++)
            for(let j=i+1; j<IDs.length && !duplicate; j++)
                if(IDs[i]==IDs[j])
                    duplicate=true;
            

    if(!valid)
        msg.push(`Missing ${nameRarity} cards`);

    if(duplicate)
        msg.push(`Several equal cards were selected from the ${nameRarity}`);

    if(valid && !duplicate)
        return {msg: msg, valid: true};

    return {msg: msg, valid: false};
}

async function sendDeals(id_trade){

    let legendaries = document.getElementsByClassName('deals_legendary_name_id');
    let heroics = document.getElementsByClassName('deals_heroic_name_id');
    let mythics = document.getElementsByClassName('deals_mythic_name_id');
    let supers = document.getElementsByClassName('deals_super_name_id');
    let commons = document.getElementsByClassName('deals_common_name_id');

    let leg_id = [];
    let her_id = [];
    let myt_id = [];
    let sup_id = [];
    let com_id = [];

    let options;

    if(checkDeals()){

        if(legendaries!=undefined && legendaries!=null && legendaries.length>0)
            for(let i=0; i<legendaries.length;i++)
                leg_id.push(legendaries[i].name);
        
        if(heroics!=undefined && heroics!=null && heroics.length>0)
            for(let i=0; i<heroics.length;i++)
                her_id.push(heroics[i].name);

        if(mythics!=undefined && mythics!=null && mythics.length>0)
            for(let i=0; i<mythics.length;i++)
                myt_id.push(mythics[i].name);

        if(supers!=undefined && supers!=null && supers.length>0)
            for(let i=0; i<supers.length;i++)
                sup_id.push(supers[i].name);
            
        if(commons!=undefined && commons!=null && commons.length>0)
            for(let i=0; i<commons.length;i++)
                com_id.push(commons[i].name);


        //Invio solo le carte scelte dall'utente. Questo perché tutte le altre informazioni 
        //possono essere prese e controllate dal server interrogando il DB
        options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                uid:uidUser,
                trade: id_trade,
                rarities: {
                    legendary:leg_id,
                    heroic: her_id,
                    mythic: myt_id,
                    super: sup_id,
                    common: com_id
                }
            })
        };

        document.getElementById('window_deals').classList.add('d-none');


        await fetch(`http://localhost:3000/trades/deal`,options)
        .then(response => response.json())
        .then(data => {
            if(data.error){
                document.getElementById("window_error").classList.remove("d-none");
                document.getElementById('menu').classList.add('z-1');

                let list = document.getElementById("msg_list");

            
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });

            } else{
                document.getElementById('window_success').classList.remove('d-none');
                document.getElementById('msg_success').innerText="";
                document.getElementById('msg_success').innerText="Deal successfully closed";
            }
        });

    }
}

async function getMyDeals(){

    let offer;
    let request;
    let deals_container = document.getElementById('myDeals_container');

    if(!authAccess()){
        logout();

    } else{
        await fetch(`http://localhost:3000/trades/myOffers/${uidUser}?trade=close`)
        .then(response => response.json())
        .then(data => {
            if(data.error){
                document.getElementById("window_error").classList.remove("d-none");

                let list = document.getElementById("msg_list");

            
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });

            } else {

                data.forEach(element => {

                    request = '';

                    if(element.request.credits!=undefined && element.request.credits!='' && element.request.credits!=null)
                        request+=`<p class="m-0 text-center"><b>Credits</b>: ${element.request.credits}</p>`;
                    
                    Object.keys(element.request.rarities).forEach( key => {
                        if(element.request.rarities[key]!=undefined && element.request.rarities[key]!=null && element.request.rarities[key]!='' )
                            request+=`<p class="m-0 text-center"><b>${key}</b>: ${element.request.rarities[key]}</p>`;
                    });

                    Object.keys(element.request.specifics).forEach( key => {
                        if(element.request.specifics[key]!=undefined && element.request.specifics[key]!=null && element.request.specifics[key]!='' )
                            request+=`<p class="m-0 text-center"><b>Hero</b>: ${element.request.specifics[key].name}</p>`;
                    });

                    offer = '';

                    if(element.offer.credits!=undefined && element.offer.credits!='' && element.offer.credits!=null)
                        offer+=`<p class="m-0 text-center"><b>Credits</b>: ${element.offer.credits}</p>`;

                    Object.keys(element.offer.specifics).forEach( key => {
                        if(element.offer.specifics[key]!=undefined && element.offer.specifics[key]!=null && element.offer.specifics[key]!='' )
                            offer+=`<p class="m-0 text-center"><b>Hero</b>: ${element.offer.specifics[key].name}</p>`;
                    });

                    deals_container.innerHTML+=`
                                    <li class="list-group-item">
                                <div class="row">
                                    <div class="col-6 d-flex justify-content-center"><h6>Request:</h6></div>
                                    <div class="col-6 d-flex justify-content-center"><h6>Offer:</h6></div>
                                </div>
                                <div class="row">
                                    <div class="col-6 d-block justify-content-center">${request}</div>
                                    <div class="col-6 d-block justify-content-center">${offer}</div>
                                </div>
                                <div class="row mt-3">
                                    <div class='col-12 d-flex justify-content-center'><span class='d-inline px-2 h-100 fw-bolder'>Buyer:</span><span class='py-0'>${element.buyer}</span></div>
                                </div>
                
                            </li>`

                });
            }
            
        });
    }
}

function logout(){
    localStorage.removeItem("uid");
    window.location.href="./index.html";
}








