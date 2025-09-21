const uidUser = localStorage.getItem("uid");
const checkID = /^[a-f0-9]{24}$/;
let album_cards;

function authAccess(){

    if(uidUser==null ||uidUser==undefined || !checkID.test(uidUser)){
        alert("Unauthorized access");
        return false;   
    }
    return true;
}

function changePage(isNext){

    let page = document.getElementById("page_number");
    let btn_next = document.getElementById("btn_next");
    let btn_prev = document.getElementById("btn_prev");
   
    isNext?page.value=++page.value:page.value=--page.value;

    if(page.value==1)
        btn_prev.classList.add("d-none");
    else    
        btn_prev.classList.remove("d-none");

    getCards();
}

async function setPage(){
    await getCards();
     getStatistics();
}

async function getCards(){

    let waiting_window = document.getElementById('waiting');
    let page = document.getElementById("page_number").value;
    let offset = page;
    let filter = document.getElementById("album_filter").value;
    let hero = document.getElementById("search_hero").value;
    const checkPage = /^[1-9][0-9]*$/;

    if(!authAccess()){
        logout();

    } else{

        if(!checkPage.test(page)){

                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");

                let list = document.getElementById("msg_list");

               
                list.innerHTML="Invalid page"; 
        }else{

            document.getElementById("menu").classList.add("z-1");
            waiting_window.classList.remove("d-none");

            //Decremento page perché gli offset del server iniziano da 0. Sul frontend invece le pagine iniziano da 1
            //Uso l'offset per non alterare il value del campo page
            --offset;
            await fetch(`http://localhost:3000/cards/${uidUser}?offset=${offset}&filter=${filter}&hero=${hero}`)
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
                //Ordino le carte in ordine di index, per facilitare l'impaginazione delle carte
            if(data.cards != null &&  data.cards != undefined && data.cards.length >0)
                data.cards.sort( (a,b) => { return a.index>b.index?1:-1; } );
  
              album_cards = data;
              setCards();
            }
        });
        }    
    }
}

async function setCards(){

    let album = document.getElementById("album");
    let page = document.getElementById("page_number").value;
    let card;
    let filter = document.getElementById("album_filter").value;
    let hero = document.getElementById("search_hero").value;
    let html_element;

    //Decremento page perché gli offset del server iniziano da 0. Sul frontend invece le pagine iniziano da 1
    page--;
    album.innerHTML = ''; //Inizializzo l'album
    html_element = ''; //Inizializzo l'elemento da inserire

    //Se è stato applicato un filtro allora impagino le carte diversamente, cioè senza carte vuote
    if((filter!='' && filter!=undefined && filter!=null) || (hero!='' && hero!=undefined && hero!=null)){

        for(let i=0; i<album_cards.cards.length; i++){

            if(i%4==0)
                html_element += " <div class='row text-center custom-font-poppins-400'>";

            html_element+= createCard(album_cards.cards[i]);

            //Nella seconda condizione controllo se è l'ultimo giro nel ciclo
            if(i%4==3 || i+1==album_cards.cards.length)
                html_element += " </div>";
        }

    } else{

        //20 è il numero massimo di carte per ogni pagina
        for(let i=0;i<20;i++){

            if(i%4==0)
                html_element += " <div class='row text-center custom-font-poppins-400'>";
            
            //(page.value*20) In questo modo prendiamo la prima carta di ogni pagina. Es: pagina 14 => prima carta 280
            //Tolgo dall'index di una carta, la prima carta di ogni pagina.Ad esempio index = 289 => 289-280= 9
            //Quindi sarà la 17esima carta della pagina
            card = (album_cards.cards.find(element => {return (element.index - (page*20)) == i }));

            if(card != undefined && card!=null)
                html_element+= createCard(card);
            else
                html_element+=`<div class="col-lg-3 col-md-6 d-flex justify-content-center ">
                        <div class="mb-4 custom-w-lg-75  custom-w-md-50">
                            <div class="custom-font-light-grey m-3 rounded custom-empty-card">${(page*20)+i}/${album_cards.maxTotalCards}</div>
                        </div></div>`

            if(i%4==3)
                html_element += " </div>";
    }
        }

    album.innerHTML=html_element;

}

//Ritorna l'elemento html formattato correttamente
function createCard(card){

    switch(card.rarity.toLowerCase()){

        case 'legendary': return ` <div class="col-md-6 col-lg-3 mt-3 d-flex justify-content-center">
                                                    <div class="custom-flip-card ">

                                                    <div class="custom-flip-card-inner">
                                                        <div class="custom-flip-card-front custom-dark-shadow">
                                                        <img src="${card.image}" class="img-fluid rounded-top custom-h-94 w-100" alt="card">
                                                        <div class="custom-line-btm-card custom-card-legendary"></div>
                                                        </div> 
                                                        
                                                        <div class="custom-flip-card-back bg-dark">
                                                        <h5 class="m-1 mt-3 custom-font-poppins-500 text-truncate">${card.name}</h5>
                                                        <div class="custom-card-information m-2" style="height: 60px; overflow: hidden;">${card.description}</div>
                                                        <div class="custom-card-information mt-2" style="height: 15px;"><b>Quantity:</b> ${card.quantity}</div>
                                                        <div class="custom-card-information mt-1" style="height: 15px;"><b>Rarity:</b> Legendary</div>
                                                        <a class="btn custom-bg-black custom-btn-dark custom-font-light custom-card-information mt-3 mb-1 py-1 " href='./details.html?hero=${card.id}'>Details</a>
                                                        </div>
                                            
                                                    </div>
                                                    </div>
                                                </div>`
                    
        case 'heroic': return `<div class="col-md-6 col-lg-3 mt-3 d-flex justify-content-center">
                                                <div class="custom-flip-card">
                                                <div class="custom-flip-card-inner">

                                                    <div class="custom-flip-card-front custom-dark-shadow">
                                                    <img src="${card.image}" class="img-fluid rounded-top w-100 custom-h-94" alt="card">
                                                    <div class="custom-line-btm-card custom-card-heroic"></div>
                                                    </div>

                                                    <div class="custom-flip-card-back bg-dark">
                                                    <h5 class="m-1 mt-3 custom-font-poppins-500 text-truncate">${card.name}</h5>
                                                    <div class="custom-card-information m-2" style="height: 60px; overflow: hidden;">${card.description}</div>
                                                    <div class="custom-card-information mt-2" style="height: 15px;"><b>Quantity:</b> ${card.quantity}</div>
                                                    <div class="custom-card-information mt-1" style="height: 15px;"><b>Rarity:</b> Heroic</div>
                                                    <a class="btn custom-bg-black custom-btn-dark custom-font-light custom-card-information mt-3 mb-1 py-1 "  href='./details.html?hero=${card.id}'>Details</a>
                                                    </div>
                                                </div>
                                                </div>
                                            </div>`
                                      
        case 'mythic': return `<div class="col-md-6 col-lg-3 mt-3 d-flex justify-content-center">
                                                <div class="custom-flip-card">
                                                <div class="custom-flip-card-inner">

                                                    <div class="custom-flip-card-front custom-dark-shadow custom-card-mythic">
                                                    <img src="${card.image}" class="img-fluid w-100 h-100" alt="card">
                                                    </div>

                                                    <div class="custom-flip-card-back bg-dark">
                                                    <h5 class="m-1 mt-3 custom-font-poppins-500 text-truncate">${card.name}</h5>
                                                    <div class="custom-card-information m-2 " style="height: 60px; overflow: hidden;">${card.description}</div>
                                                    <div class="custom-card-information mt-2" style="height: 15px;"><b>Quantity:</b> ${card.quantity}</div>
                                                    <div class="custom-card-information mt-1" style="height: 15px;"><b>Rarity:</b> Mythic</div>
                                                    <a class="btn custom-bg-black custom-btn-dark custom-font-light custom-card-information mt-3 mb-1 py-1 "  href='./details.html?hero=${card.id}'>Details</a>
                                                    </div>
                                                </div>
                                                </div>
                                            </div>`

        case 'super': return `<div class="col-md-6 col-lg-3 mt-3 d-flex justify-content-center ">
                                                <div class="custom-flip-card">
                                                <div class="custom-flip-card-inner">

                                                    <div class="custom-flip-card-front custom-card-super custom-dark-shadow">
                                                    <img src="${card.image}" class="img-fluid h-100 w-100" alt="card">
                                                    </div>

                                                    <div class="custom-flip-card-back bg-dark">
                                                    <h5 class="m-1 mt-3 custom-font-poppins-500 text-truncate">${card.name}</h5>
                                                    <div class="custom-card-information m-2" style="height: 60px; overflow: hidden;">${card.description}</div>
                                                    <div class="custom-card-information mt-2" style="height: 15px;"><b>Quantity:</b> ${card.quantity}</div>
                                                    <div class="custom-card-information mt-1" style="height: 15px;"><b>Rarity:</b> Super</div>
                                                    <a class="btn custom-bg-black custom-btn-dark custom-font-light custom-card-information mt-3 mb-1 py-1"  href='./details.html?hero=${card.id}'>Details</a>
                                                    </div>

                                                </div>
                                                </div> 
                                            </div>`
        
            case 'common': return `<div class="col-md-6 col-lg-3 mt-3 d-flex justify-content-center">
                                                    <div class="custom-flip-card">
                                                    <div class="custom-flip-card-inner">

                                                        <div class="custom-flip-card-front custom-dark-shadow">
                                                        
                                                        <img src="${card.image}" class="img-fluid rounded h-100 w-100" alt="card">

                                                        </div>

                                                        <div class="custom-flip-card-back bg-dark">
                                                        <h5 class="m-1 mt-3 custom-font-poppins-500 text-truncate">${card.name}</h5>
                                                        <div class="custom-card-information m-2" style="height: 60px; overflow: hidden;">${card.description}</div>
                                                        <div class="custom-card-information mt-2" style="height: 15px;"><b>Quantity:</b> ${card.quantity}</div>
                                                        <div class="custom-card-information mt-1" style="height: 15px;"><b>Rarity:</b> Common</div>
                                                        <a class="btn custom-bg-black custom-btn-dark custom-font-light custom-card-information mt-3 mb-1 py-1 "  href='./details.html?hero=${card.id}'>Details</a>
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>`

    }
}

function getStatistics(){

    if(!authAccess()){
        logout();

    } else{

        fetch(`http://localhost:3000/statistics/${uidUser}`)
        .then(response => response.json())
        .then(res => {

            document.getElementById("stat_TotalCards").innerText+=res.userTotalCards;
            document.getElementById("stat_LegendaryCards").innerText+=res.legendaries;
            document.getElementById("stat_HeroicCards").innerText+=res.heroics;
            document.getElementById("stat_MythicCards").innerText+=res.mythics;
            document.getElementById("stat_SuperCards").innerText+=res.super;
            document.getElementById("stat_CommonCards").innerText+=res.commons;

        });
    }
}


function logout(){
    localStorage.removeItem("uid");
    window.location.href="./index.html";
}