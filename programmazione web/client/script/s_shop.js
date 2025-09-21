const uidUser = localStorage.getItem("uid");
const checkID = /^[a-f0-9]{24}$/;

function setPage(){
    setMenu();
    getPackets();
}

function setMenu(){
    if(localStorage.getItem("uid") != null && localStorage.getItem("uid") != undefined){
        document.getElementById("menu-basic").classList.add("d-none");
        document.getElementById("menu").classList.remove("d-none");
        document.getElementById("basic_footer").classList.add("d-none");
        document.getElementById("footer").classList.remove("d-none");
    }
}

function getPackets(){
    
        let specialPackets = document.getElementById("special_packets");
        let packets = document.getElementById("packets");
    
        fetch('http://localhost:3000/packets')
        .then(response => response.json())
        .then(data => {
   
                data.forEach(element => {

                    if(element.special){

                        //Inserisco nel pulsante per acquistare, il metodo con l'id del packet tra i parametri attuali. 
                        //questo id verrà passatto a sua volta al metodo per confermare l'acquisto
                        specialPackets.innerHTML+= ` 
                        <div class="col-lg-4 col-md-4  col-sm-12 mt-4 mb-4">
                        <div class="card custom-packet custom-offer-card" >
                            <div class="card-body custom-font-dark">
                            <h5 class="card-title">${element.title}</h5>
                            <p class="card-text custom-font-poppins-400">${element.description}</p>
                            <p class="card-text custom-font-poppins-400">Cost: ${element.cost}<img class=" custom-coin img-fluid" src="images/icon/coin.png" style="width:18px ; height: 18px; margin-left:4px; margin-bottom:1px;"></p>
                            <a href="#" class="btn d-flex justify-content-center custom-bg-black custom-btn-dark custom-font-light" onclick="openConfirm('${element._id}')">Purchase</a>
                            </div>                                                  
                        </div>
                        </div>`;

                    } else{
                        packets.innerHTML+= `<div class="col-lg-3 col-md-4 col-sm-12 mt-4 ">
                        <div class="card custom-packet" style='background-color:${element.color};'>
                          <div class="card-body custom-font-light">
                            <h5 class="card-title">${element.title}</h5>
                            <p class="card-text custom-font-poppins-400">${element.description}</p>
                            <p class="card-text custom-font-poppins-400">Cost: ${element.cost}<img class=" custom-coin img-fluid" src="images/icon/coin_white.png" style="width:18px ; height: 18px; margin-left:4px; margin-bottom:1px;"></p>
                            <a  class="btn d-flex justify-content-center custom-bg-black custom-btn-dark custom-font-light" onclick="openConfirm('${element._id}')">Purchase</a>
                          </div>
                        </div>
                      </div>`;
                    }
                });        
    
        });
}

//Inserisce l'id packet nell'attributo name della window (all'interno dello span con id packet_id)
function openConfirm(id_packet){

    document.getElementById("menu-basic").classList.add("z-1");
    document.getElementById("menu").classList.add("z-1");

     document.getElementById("window_confirm").classList.remove('d-none');
    //Salvo all'interno di uno span non visibile (nell'attributo name), l'id del pacchetto da acquistare
    document.getElementById("packet_id").name=id_packet;
}

function purchase(){

    let window_error = document.getElementById("window_error");
    let window_confirm = document.getElementById("window_confirm");
    let waiting_window = document.getElementById('waiting');
    let packet_id = document.getElementById('packet_id').name;
    let window_cards = document.getElementById("window_open_cards");

    window_confirm.classList.add("d-none");
   
    if(!checkID.test(uidUser)){
        window_error.classList.remove("d-none");
        document.getElementById("msg_list").innerText="You must log in properly with your account to be able to purchase";
    
    } else{

        waiting_window.classList.remove('d-none');
        
        fetch(`http://localhost:3000/purchase/${uidUser}/${packet_id}`)
        .then(response => response.json())
        .then(data => {

            waiting_window.classList.add('d-none');

            if(data.error){
                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");

                let list = document.getElementById("msg_list");

               
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });

            } else{
                window_cards.classList.remove("d-none");
                setCards(data.cards);
            }
        });

    }
}

//Questa funzione dispone le carte nella finestra per mostrare le carte trovare in un pacchetto
function setCards(data){

    let cards_list = document.getElementById("cards_list");

    cards_list.innerHTML = '';
    document.getElementById("discover_button").classList.remove("d-none"); //Abilito il pulsante discover

    data.forEach(card => {
    
        switch(card.rarity.toLowerCase()){

            case 'legendary': cards_list.innerHTML+=` <div class="col-lg-3 col-md-6 mt-3 d-flex justify-content-center new_card d-none">
                                                        <div class="custom-flip-card ">

                                                        <div class="custom-flip-card-inner">
                                                            <div class="custom-flip-card-front custom-dark-shadow">
                                                            <img src="${card.image}" class="img-fluid rounded-top custom-h-94 w-100" alt="card">
                                                            <div class="custom-line-btm-card custom-card-legendary"></div>
                                                            </div> 
                                                            
                                                            <div class="custom-flip-card-back bg-dark">
                                                            <h5 class=m-1 "mt-3 custom-font-poppins-500 text-truncate">${card.name}</h5>
                                                            <div class="custom-card-information m-2 t" style="height: 90px; overflow: hidden;">${card.description}</div>
                                                            <div class="custom-card-information mt-3" style="height: 15px;"><b>Quantity:</b> ${card.quantity}</div>
                                                            <div class="custom-card-information mt-1" style="height: 15px;"><b>Rarity:</b> Legendary</div>
                                                            </div>
                                                
                                                        </div>
                                                        </div>
                                                    </div>`
                                                    break;
                        
            case 'heroic': cards_list.innerHTML+= `<div class="col-lg-3 col-md-6 mt-3 d-flex justify-content-center new_card d-none">
                                                    <div class="custom-flip-card">
                                                    <div class="custom-flip-card-inner">

                                                        <div class="custom-flip-card-front custom-dark-shadow">
                                                        <img src="${card.image}" class="img-fluid rounded-top w-100 custom-h-94" alt="card">
                                                        <div class="custom-line-btm-card custom-card-heroic"></div>
                                                        </div>

                                                        <div class="custom-flip-card-back bg-dark">
                                                        <h5 class="m-1 mt-3 custom-font-poppins-500 text-truncate">${card.name}</h5>
                                                        <div class="custom-card-information m-2 t" style="height: 90px; overflow: hidden;">${card.description}</div>
                                                        <div class="custom-card-information mt-3" style="height: 15px;"><b>Quantity:</b> ${card.quantity}</div>
                                                        <div class="custom-card-information mt-1" style="height: 15px;"><b>Rarity:</b> Heroic</div>
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>`
                                                break;
            
            case 'mythic': cards_list.innerHTML+= `<div class="col-lg-3 col-md-6 mt-3 d-flex justify-content-center new_card d-none">
                                                    <div class="custom-flip-card">
                                                    <div class="custom-flip-card-inner">

                                                        <div class="custom-flip-card-front custom-dark-shadow custom-card-mythic">
                                                        <img src="${card.image}" class="img-fluid w-100 h-100" alt="card">
                                                        </div>

                                                        <div class="custom-flip-card-back bg-dark">
                                                        <h5 class="m-1 mt-3 custom-font-poppins-500 text-truncate">${card.name}</h5>
                                                        <div class="custom-card-information m-2 t" style="height: 90px; overflow: hidden;">${card.description}</div>
                                                        <div class="custom-card-information mt-3" style="height: 15px;"><b>Quantity:</b> ${card.quantity}</div>
                                                        <div class="custom-card-information mt-1" style="height: 15px;"><b>Rarity:</b> Mythic</div>
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>`
                                                break;

            case 'super': cards_list.innerHTML+= `<div class="col-lg-3 col-md-6 mt-3 d-flex justify-content-center new_card d-none ">
                                                    <div class="custom-flip-card">
                                                    <div class="custom-flip-card-inner">

                                                        <div class="custom-flip-card-front custom-card-super custom-dark-shadow">
                                                        <img src="${card.image}" class="img-fluid h-100 w-100" alt="card">
                                                        </div>

                                                        <div class="custom-flip-card-back bg-dark">
                                                        <h5 class="m-1 mt-3 custom-font-poppins-500 text-truncate">${card.name}</h5>
                                                        <div class="custom-card-information m-2 t" style="height: 90px; overflow: hidden;">${card.description}</div>
                                                        <div class="custom-card-information mt-3" style="height: 15px;"><b>Quantity:</b> ${card.quantity}</div>
                                                        <div class="custom-card-information mt-1" style="height: 15px;"><b>Rarity:</b> Super</div>
                                                        </div>

                                                    </div>
                                                    </div> 
                                                </div>`
                                                break;
            
                case 'common': cards_list.innerHTML+= `<div class="col-lg-3 col-md-6 mt-3 d-flex justify-content-center new_card d-none">
                                                        <div class="custom-flip-card">
                                                        <div class="custom-flip-card-inner">

                                                            <div class="custom-flip-card-front custom-dark-shadow">
                                                            
                                                            <img src="${card.image}" class="img-fluid rounded h-100 w-100" alt="card">

                                                            </div>

                                                            <div class="custom-flip-card-back bg-dark">
                                                            <h5 class="m-1 mt-3 custom-font-poppins-500 text-truncate">${card.name}</h5>
                                                            <div class="custom-card-information m-2 t" style="height: 90px; overflow: hidden;">${card.description}</div>
                                                            <div class="custom-card-information mt-3" style="height: 15px;"><b>Quantity:</b> ${card.quantity}</div>
                                                            <div class="custom-card-information mt-1" style="height: 15px;"><b>Rarity:</b> Common</div>
                                                            </div>
                                                        </div>
                                                        </div>
                                                    </div>`

        }
        
    });
}

function discoverCards(){

    let new_cards = document.querySelectorAll(".new_card.d-none");
    let button = document.getElementById("discover_button");
    
    if(new_cards.length>0){
        new_cards[0].classList.remove("d-none");
    }

    //Riprendo il valore del numero di carte che devono essere scoperte, per capire se ce ne saranno altre
    new_cards = document.querySelectorAll(".new_card.d-none");

    if(new_cards.length==0)
        button.classList.add("d-none");


}

function buyCredits(){

    let checkCredits = /^[1-9][0-9]*$/;
    let credits_to_purchase = document.getElementById("album-coins").value;
    let waiting_window = document.getElementById("waiting");

    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            uid:uidUser,
            credits: credits_to_purchase
        })
    }

    if(!checkID.test(uidUser)){

        document.getElementById("menu").classList.add("z-1");
        window_error.classList.remove("d-none");
        document.getElementById("msg_list").innerText="You must log in properly with your account to be able to purchase";

    } else if(!checkCredits.test(credits_to_purchase)){ 

        document.getElementById("menu").classList.add("z-1");
        window_error.classList.remove("d-none");
        document.getElementById("msg_list").innerText="Invalid credits to purchase";

    } else{
        fetch('http://localhost:3000/credits', options)
        .then(response => response.json())
        .then(data => {

            waiting_window.classList.add('d-none');

            if(data.error){
                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");

                let list = document.getElementById("msg_list");

               
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });

            } else{

                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_success").classList.remove("d-none");

                document.getElementById("msg_success").innerText = data.msg;
                
            }
        });
    }
}

function logout(){
    localStorage.removeItem("uid");
    window.location.href="./index.html";
}

