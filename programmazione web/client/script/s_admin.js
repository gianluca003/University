const uidAdmin = localStorage.getItem("uid");
const checkID = /^[a-f0-9]{24}$/;

function authAccess(){

    if(uidAdmin==null ||uidAdmin==undefined || !checkID.test(uidAdmin)){
        alert("Unauthorized access");
        return false;   
    }
    return true;
}

async function getContents(){

    //La funzione controlla se l'uid non dovesse esistere
    if(!authAccess()){
        logout();

    } else{
        await getDraftsPackets();
        await getPackets();
        await getPosts();
    }
}

async function getDraftsPackets(){

    let draftsSpecial = document.getElementById("drafts_special_packets");
    let draftsPackets = document.getElementById("drafts_packets");
  
    await fetch(`http://localhost:3000/packets/drafts?admin=${uidAdmin}`)
    .then(response => response.json())
    .then(data => {
       
        if((data.admin!=null && data.admin!=undefined) &&  data.admin==false){
            alert(data.msg);
            logout();

        } else{
            document.getElementById("container").classList.remove("d-none");

            if(data.length>0)
                data.forEach(element => {
                    if(element.special)
                        draftsSpecial.innerHTML+= `<option value=${element._id}>${element.title}</option>`;
                    else
                        draftsPackets.innerHTML+= `<option value=${element._id}>${element.title}</option>`;
                });    
        }
    });
}

async function getPackets(){

    
    let specialPackets = document.getElementById("special_packets");
    let packets = document.getElementById("packets");

    await fetch('http://localhost:3000/packets')
    .then(response => response.json())
    .then(data => {

        if((data.admin!=null && data.admin!=undefined) && data.admin==false){
            alert(data.msg);
            logout();

        } else{

            data.forEach(element => {
                if(element.special)
                    specialPackets.innerHTML+= `<option value=${element._id}>${element.title}</option>`;
                else
                    packets.innerHTML+= `<option value=${element._id}>${element.title}</option>`;
            });
        }

    });

}

async function getPosts(){

    let urlOne = document.getElementById("url_post_one"); 
    let urlTwo = document.getElementById("url_post_two"); 
    let imgOne = document.getElementById("img_post_one"); 
    let imgTwo = document.getElementById("img_post_two"); 
    let titleOne = document.getElementById("title_post_one");
    let titleTwo = document.getElementById("title_post_two");
    let articleOne = document.getElementById("description_post_one");
    let articleTwo = document.getElementById("description_post_two");

    await fetch('http://localhost:3000/post')
    .then(response => response.json())
    .then(data => {

        if((data.admin!=null && data.admin!=undefined) &&  data.admin==false){
            alert(data.msg);
            logout();

        } else{
            //ordino i post che mi arrivano in base al numero degli indici (es. post uno = index:1)
          data.sort((a,b) => a.index<b.index?-1:1 );

          urlOne.value = data[0].url;
          imgOne.src = data[0].url;
          titleOne.value = data[0].title;
          articleOne.value = data[0].description;

          urlTwo.value = data[1].url;
          imgTwo.src = data[1].url;
          titleTwo.value = data[1].title;
          articleTwo.value = data[1].description;
        }

    });
}

async function addImgOne(){

    let urlPost = document.getElementById("url_post_one").value;
   
    options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uid: uidAdmin,
            url: urlPost,
            index: 1,
            image: true,  //Questi ultimi due parametri mi servono per dire al server che 
            article:false //cosa voglio modificare
        })
    }

    await fetch("http://localhost:3000/post", options);
    window.location.reload();
    
}

async function addImgTwo(){

    let urlPost = document.getElementById("url_post_two").value;
   
    options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uid: uidAdmin,
            url: urlPost,
            index: 2,
            image: true,  //Questi ultimi due parametri mi servono per dire al server che 
            article:false //cosa voglio modificare
        })
    }

    await fetch("http://localhost:3000/post", options);
    window.location.reload();
  
}

async function addArticleOne(){

    let titlePost = document.getElementById("title_post_one").value;
    let descriptionPost = document.getElementById("description_post_one").value;

    options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uid: uidAdmin,
            title: titlePost,
            description: descriptionPost,
            index: 1,
            image: false,  //Questi ultimi due parametri mi servono per dire al server che 
            article: true //cosa voglio modificare
        })
    }

    await fetch("http://localhost:3000/post", options);
    window.location.reload();
}

async function addArticletwo(){

    let titlePost = document.getElementById("title_post_two").value;
    let descriptionPost = document.getElementById("description_post_two").value;

    options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uid: uidAdmin,
            title: titlePost,
            description: descriptionPost,
            index: 2,
            image: false,  //Questi ultimi due parametri mi servono per dire al server che 
            article: true //cosa voglio modificare
        })
    }
    
    await fetch("http://localhost:3000/post", options);
    window.location.reload();
   
}

function checkTitle(id_input, id_label){

    const checkTitle = /^[a-z][a-z1-9:,-.!\'_ ]+$/i;
    let input = document.getElementById(id_input);
    let label = document.getElementById(id_label);

    if(checkTitle.test(input.value)){
         input.classList.remove("border");
         input.classList.remove("border-3");
         input.classList.remove("border-danger");
         label.classList.remove("text-danger");
         return true;

    } else{
         input.classList.add("border");
         input.classList.add("border-3");
         input.classList.add("border-danger");
         label.classList.add("text-danger");
         return false;
    }
}

function checkDescription(id_input, id_label){

    const checkDescription = /^[a-z1-9][a-z1-9"€$'-_%()èùàòì+/*£!ç@:;,. ]*$/i;
    let input = document.getElementById(id_input);
    let label = document.getElementById(id_label);

    if(checkDescription.test(input.value)){
       
         input.classList.remove("border-3");
         input.classList.remove("border-danger");
         label.classList.remove("text-danger");
         return true;

    } else{
        input.classList.remove("border-dark");
         input.classList.add("border-3");
         input.classList.add("border-danger");
         label.classList.add("text-danger");
         return false;
    }
    
}

function checkCost(id_input,id_label){

    let input = document.getElementById(id_input);
    let label = document.getElementById(id_label);

    if(input.value>0){
         input.classList.remove("border");
         input.classList.remove("border-3");
         input.classList.remove("border-danger");
         label.classList.remove("text-danger");
         return true;

    } else{
         input.classList.add("border");
         input.classList.add("border-3");
         input.classList.add("border-danger");
         label.classList.add("text-danger");
         return false;
    }
    
}

function checkTotalCards(id_input,id_label){
    let input = document.getElementById(id_input);
    let label = document.getElementById(id_label);

    if(input.value>0){
         input.classList.remove("border");
         input.classList.remove("border-3");
         input.classList.remove("border-danger");
         label.classList.remove("text-danger");
         return true;

    } else{
         input.classList.add("border");
         input.classList.add("border-3");
         input.classList.add("border-danger");
         label.classList.add("text-danger");
         return false;
    }
}

function checkCards(class_cardsType, label_cardsTypes, id_totalCards, id_random){

    //La funzione prende tutte le quantità per ogni tipo di carta
    //Se il numero totale dei tipi dovesse essere minore dei total cards
    //e se il campo random dovesse esser attivato, allora i tipi delle carte rimanenti
    //verranno scelte casualmente dal server
    
    //Contiene il numero di ogni tipo di carta che è possibile trovare in un pacchetto
    let cardsType = document.getElementsByClassName(class_cardsType);
    let label_cardsType = document.getElementsByClassName(label_cardsTypes);
    let totalCards = document.getElementById(id_totalCards).value;
    let random = document.getElementById(id_random).checked;
    let counter = 0;

    for(let i=0; i<cardsType.length; i++){
        if( !isNaN(parseInt(cardsType[i].value)) && cardsType[i].value!=null && cardsType[i].value!=undefined) 
            counter+= parseInt(cardsType[i].value);
    }
    
    if((counter>totalCards) || (counter<totalCards && random==false)){
        
        for(let i=0; i<cardsType.length; i++){
            cardsType[i].classList.add("border");
            cardsType[i].classList.add("border-3");
            cardsType[i].classList.add("border-danger");
       }
   
       for(let i=0; i<label_cardsType.length; i++)
        label_cardsType[i].classList.add("text-danger");
       
        return false;
    } 

    for(let i=0; i<cardsType.length; i++){ 
        cardsType[i].classList.remove("border");
        cardsType[i].classList.remove("border-3");
        cardsType[i].classList.remove("border-danger");
   }

   for(let i=0; i<label_cardsType.length; i++)
        label_cardsType[i].classList.remove("text-danger");

    return true;
}

function checkRandom(id_random, class_cardsType, id_totalCards){
    let random = document.getElementById(id_random);
    let cardsType = document.getElementsByClassName(class_cardsType);
    let totalCards = document.getElementById(id_totalCards).value;
    let counter = 0;

    for(let i=0; i<cardsType.length; i++){
        if( !isNaN(parseInt(cardsType[i].value)) && cardsType[i].value!=null && cardsType[i].value!=undefined) 
            counter+= parseInt(cardsType[i].value);
    }

    if(counter>=totalCards)
        random.checked = false;


}

function sendFormSpecial(){

    let modifiedFields; //Conterrà l'oggetto da inviare nel caso si volessero modificare solo alcuni campi

    //La funzione controlla se l'uid non dovesse esistere
    if(!authAccess()){
        logout();

    } else{
        if(checkTitle("special_title","label_special_title"))
            if(checkDescription("special_description","label_special_description"))
                if(checkCost("special_cost","label_special_cost"))
                    if(checkTotalCards("special_totalCards","label_special_totalCards"))
                        if(checkCards("special_card_type","label_special_card_type","special_totalCards","special_rand")){
                            //CheckRandom controllo i vari parametri e setta correttamente il random
                            checkRandom("special_rand","special_card_type","special_totalCards");

                            if(isModify("special_compare_field")==false)
                                addDraftPacket('special_input',"special_rand","special_card_type",true);
                            else{

                                modifiedFields = getModifiedFields("special_windows_field","input_special_random","special_card_type","special_totalCards");

                                if(modifiedFields!=null && modifiedFields!=undefined && JSON.stringify(modifiedFields)!='{}'){
                                    
                                    //Inserisco il valore dell'id del pacchetto
                                    modifiedFields['id']=document.getElementById("drafts_special_packets").value;
                                    modifyDraftPacket(modifiedFields);
                                }
                                    
                            }
                                
                        }
          }
}

function sendFormPacket(){

    let modifiedFields; //Conterrà l'oggetto da inviare nel caso si volessero modificare solo alcuni campi

    //La funzione controlla se l'uid non dovesse esistere
    if(!authAccess()){
        logout();

    } else{

        if(checkTitle("packet_title","label_packet_title"))
            if(checkDescription("packet_description","label_packet_description"))
                if(checkCost("packet_cost","label_packet_cost"))
                    if(checkTotalCards("packet_totalCards","label_packet_totalCards"))
                        if(checkCards("packet_card_type","label_packet_card_type","packet_totalCards","packet_rand")){
                            //CheckRandom controllo i vari parametri e setta correttamente il random
                            checkRandom("packet_rand","packet_card_type","packet_totalCards");

                            if(isModify("packet_compare_field")==false)
                                addDraftPacket('packet_input',"packet_rand","packet_card_type",false);
                            else{

                                modifiedFields = getModifiedFields("packet_windows_field","input_packet_random","packet_card_type","packet_totalCards");

                                if(modifiedFields!=null && modifiedFields!=undefined && JSON.stringify(modifiedFields)!='{}'){
                                    
                                    //Inserisco il valore dell'id del pacchetto
                                    modifiedFields['id']=document.getElementById("drafts_packets").value;
                                    modifyDraftPacket(modifiedFields);
                                }
                                    
                            }
                                
                        }
          }
}

//Se tutti i campi in cui vengono inseriti i valori per 
//comparare sono vuoti, allora si tratta di un add, altrimenti
//di un modify
function isModify(class_name){

    let fields = document.getElementsByClassName(class_name);
    let modified = false;

    //length -1 per escludere i colori che avranno sempre un valore
    for(let i=0; i<fields.length-1;i++){
        if(fields[i].value!=null && fields[i].value!=undefined && fields[i].value!='' && fields[i].value!=0)
            modified=true;
    }
    return modified;
}

function initializeWindow(class_name){

    let fields = document.getElementsByClassName(class_name);

    for(let i=0; i<fields.length;i++)

        if(fields[i].classList.contains("input_color"))
            fields[i].value='#b50606';

        else if(fields[i].classList.contains("input_random"))
            fields[i].checked=false;
        else
            fields[i].value='';
}

function openSpecialDraftPacket(){

    initializeWindow("special_windows_field");
    document.getElementById("window_special").classList.remove("d-none");
    document.getElementById("menu").classList.add("z-1");
    document.getElementById("special_title_window").innerText="Create special packet:";

}

function openModifySpecialPacket(){
 
    let id = document.getElementById("drafts_special_packets").value;

    let title = document.getElementById("special_title");
    let description = document.getElementById("special_description");
    let cost = document.getElementById("special_cost");
    let totalCards = document.getElementById("special_totalCards");
    let leg = document.getElementById("special_leg");
    let her = document.getElementById("special_her");
    let myt = document.getElementById("special_myt");
    let sup = document.getElementById("special_sup");
    let com = document.getElementById("special_com");
    let rand = document.getElementById("special_rand");
    let color = document.getElementById("special_color");

    if(checkID.test(id)){
        document.getElementById("window_special").classList.remove("d-none");
        document.getElementById("menu").classList.add("z-1");
        document.getElementById("special_title_window").innerText="Modify special packet:";

            fetch(`http://localhost:3000/packets/drafts/${id}?admin=${uidAdmin}`)
             .then(response => response.json())
             .then(data => {
     
                //Inserisco in tutti i campi i dati inerenti al pacchetto
                 title.value=data.title;
                 description.value=data.description;
                 cost.value=data.cost;
                 totalCards.value=data.totalCards;
                 leg.value=data.cards.legendaries;
                 her.value=data.cards.heroics;
                 myt.value=data.cards.mythics;
                 sup.value=data.cards.super;
                 com.value=data.cards.commons;
                 rand.checked=data.random;
                 color.value=data.color;
     
                 //Inserisco anche negli input non visibili (d-none) i vari valori.
                 //Questi mi serviranno nel caso volessi modificare un pacchetto.
                 //Confronto e invio al server solo i dati effettivamente modificati
                 document.getElementById("special_comp_title").value=data.title;
                 document.getElementById("special_comp_description").value=data.description;
                 document.getElementById("special_comp_cost").value=data.cost;
                 document.getElementById("special_comp_totalCards").value=data.totalCards;
                 document.getElementById("special_comp_leg").value=data.cards.legendaries; 
                 document.getElementById("special_comp_her").value=data.cards.heroics;
                 document.getElementById("special_comp_myt").value=data.cards.mythics;
                 document.getElementById("special_comp_sup").value=data.cards.super;
                 document.getElementById("special_comp_com").value=data.cards.commons;
                 document.getElementById("special_comp_rand").checked=data.random;
                 document.getElementById("special_comp_color").value=data.color;
             });
    }
}

function openDraftPacket(){

    initializeWindow("packet_windows_field");
    document.getElementById("window_packet").classList.remove("d-none");
    document.getElementById("menu").classList.add("z-1");
    document.getElementById("packet_title_window").innerText="Create packet:";

}

function openModifyPacket(){
 
    let id = document.getElementById("drafts_packets").value;

    let title = document.getElementById("packet_title");
    let description = document.getElementById("packet_description");
    let cost = document.getElementById("packet_cost");
    let totalCards = document.getElementById("packet_totalCards");
    let leg = document.getElementById("packet_leg");
    let her = document.getElementById("packet_her");
    let myt = document.getElementById("packet_myt");
    let sup = document.getElementById("packet_sup");
    let com = document.getElementById("packet_com");
    let rand = document.getElementById("packet_rand");
    let color = document.getElementById("packet_color");

    if(checkID.test(id)){
        document.getElementById("window_packet").classList.remove("d-none");
        document.getElementById("menu").classList.add("z-1");
        document.getElementById("packet_title_window").innerText="Modify packet:";

            fetch(`http://localhost:3000/packets/drafts/${id}?admin=${uidAdmin}`)
             .then(response => response.json())
             .then(data => {
     
                //Inserisco in tutti i campi i dati inerenti al pacchetto
                 title.value=data.title;
                 description.value=data.description;
                 cost.value=data.cost;
                 totalCards.value=data.totalCards;
                 leg.value=data.cards.legendaries;
                 her.value=data.cards.heroics;
                 myt.value=data.cards.mythics;
                 sup.value=data.cards.super;
                 com.value=data.cards.commons;
                 rand.checked=data.random;
                 color.value=data.color;
     
                 //Inserisco anche negli input non visibili (d-none) i vari valori.
                 //Questi mi serviranno nel caso volessi modificare un pacchetto.
                 //Confronto e invio al server solo i dati effettivamente modificati
                 document.getElementById("packet_comp_title").value=data.title;
                 document.getElementById("packet_comp_description").value=data.description;
                 document.getElementById("packet_comp_cost").value=data.cost;
                 document.getElementById("packet_comp_totalCards").value=data.totalCards;
                 document.getElementById("packet_comp_leg").value=data.cards.legendaries; 
                 document.getElementById("packet_comp_her").value=data.cards.heroics;
                 document.getElementById("packet_comp_myt").value=data.cards.mythics;
                 document.getElementById("packet_comp_sup").value=data.cards.super;
                 document.getElementById("packet_comp_com").value=data.cards.commons;
                 document.getElementById("packet_comp_rand").checked=data.random;
                 document.getElementById("packet_comp_color").value=data.color;
             });
    }
}

async function addDraftPacket(class_fields, class_rand, class_cardType,special){


    let fields = document.getElementsByClassName(class_fields);
    let fields_to_send = {};

    //Creo l'oggetto cards che verrà successivamente riempito
    fields_to_send['cards']= {};

    for(let i=0; i<fields.length; i++){
         //Cerco di capire se si tratta di una checkbox random o no
            if(!fields[i].classList.contains(class_rand)){

                //Se si tratta di una quantita di una rarita di una carta, allora lo formatto dentro un altro oggetto (cards)
                if(fields[i].classList.contains(class_cardType)){

                    fields_to_send.cards[`${fields[i].name}`]=fields[i].value

                } else
                    fields_to_send[`${fields[i].name}`]=fields[i].value;
            }
              
            else{
                fields_to_send[`${fields[i].name}`]=fields[i].checked;
                console.log(fields[i].checked)
            }
                
    }

    fields_to_send['special']=special;
    fields_to_send['uid']=uidAdmin;

    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(fields_to_send)
    };

    await fetch("http://localhost:3000/packets/drafts",options)
    .then(response =>response.json())
    .then(data => {
        
        if((data.admin!=null && data.admin!=undefined) && data.admin==false){
            alert(data.msg);
            logout();

        } else{

            if(data.error){
                
                let list = document.getElementById("msg_list");

                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");
                document.getElementById("window_special").classList.add("d-none");
                document.getElementById("window_packet").classList.add("d-none");

                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });
            }
            else{
                location.reload();
            }
        }
            
        }
    );
  
}

async function modifyDraftPacket(packet){

    options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uid: uidAdmin,
            packet
        })
    }

    await fetch("http://localhost:3000/packets/drafts",options)
    .then(data => {

        if((data.admin!=null && data.admin!=undefined) && data.admin==false){
            alert(data.msg);
            logout();

        } else{

            if(data.error){
            
                document.getElementById("menu").classList.add("z-1");
                document.getElementById("window_error").classList.remove("d-none");
                document.getElementById("window_special").classList.add("d-none");
                document.getElementById("window_packet").classList.add("d-none");
    
                let list = document.getElementById("msg_list");
    
                list.innerHTML=""; //Inizializzo la lista dei messaggi di errore
    
                data.msg.forEach(element => {
                    list.innerHTML+=`<li class="m-2">${element}</li>`;
                });
            }
            else{
                location.reload();
            }
        }
        
        
    }
);
}

function getModifiedFields(class_fields, class_rand, class_cardType, id_totalCards){

    let fields = document.getElementsByClassName(class_fields);
    let fields_to_send = {};
    let first_cardType = true; //Flag che uso per creare solo la prima volta l'oggetto 'cards' all'interno del json

    //Questo ciclo controlla tutti i campi di una determinata window
    //e confronta un campo in input con il suo successore
    //un campo input nascosto (d-none)
    //Si incrementa di due per poter prendere solo i campi visibil (i +1 sono quelli non visibili)
    for(let i=0; i<fields.length-1; i+=2){
      
        if(fields[i].value!=fields[i+1].value || (fields[i].checked!=fields[i+1].checked)){

            //Cerco di capire se si tratta di una checkbox random o no
            if(!fields[i].classList.contains(class_rand)){

                //Se si tratta di una quantita di una rarita di una carta, allora lo formatto dentro un altro oggetto (cards)
                if(fields[i].classList.contains(class_cardType)){

                    if(first_cardType){
                        fields_to_send['cards']= {};
                        first_cardType=false;
                    }
 
                    fields_to_send.cards[`${fields[i].name}`]=fields[i].value

                } else
                    fields_to_send[`${fields[i].name}`]=fields[i].value;
            }
              
            else
                fields_to_send[`${fields[i].name}`]=fields[i].checked;

            //Se viene modificato un campo delle carte, allora devo mandare
            //anche il campo totalCards e random per fare i controlli di validità 
            //dell'input
            if(fields[i].classList.contains(class_cardType)){
                fields_to_send['totalCards']=document.getElementById(id_totalCards).value;
                fields_to_send['random']=document.getElementsByClassName(class_rand)[0].checked;
            }
        }
            
    }
    return fields_to_send;   
}

async function deleteDraft(id_select){

    let packet = document.getElementById(id_select).value;

    options = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
    }

    if(checkID.test(packet)){
        await fetch(`http://localhost:3000/packets/drafts/${packet}?admin=${uidAdmin}`,options)
        .then(data => {

            if((data.admin!=null && data.admin!=undefined) && data.admin==false){
                alert(data.msg);
                logout();
    
            } else{

                if(data.error){
                    
                    document.getElementById("menu").classList.add("z-1");
                    document.getElementById("window_error").classList.remove("d-none");
                    document.getElementById("window_special").classList.add("d-none");
                    document.getElementById("window_packet").classList.add("d-none");

                    let list = document.getElementById("msg_list");

                    list.innerHTML=""; //Inizializzo la lista dei messaggi di errore

                    data.msg.forEach(element => {
                        list.innerHTML+=`<li class="m-2">${element}</li>`;
                    });
                }
                else{
                    location.reload();
                }
            }
        
        }
    );
    }
        
}

async function activePacket(id_draftSelect){

    let id_packet = document.getElementById(id_draftSelect).value;
    options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uid: uidAdmin,
            id:id_packet,
        })
    }

    if(checkID.test(id_packet)){
        await fetch("http://localhost:3000/packets",options).then(data => {

            if((data.admin!=null && data.admin!=undefined) && data.admin==false){
                alert(data.msg);
                logout();
    
            } else{
                if(data.error){
                
                    document.getElementById("menu").classList.add("z-1");
                    document.getElementById("window_error").classList.remove("d-none");
                    document.getElementById("window_special").classList.add("d-none");
                    document.getElementById("window_packet").classList.add("d-none");
    
                    let list = document.getElementById("msg_list");
    
                    list.innerHTML=""; //Inizializzo la lista dei messaggi di errore
    
                    data.msg.forEach(element => {
                        list.innerHTML+=`<li class="m-2">${element}</li>`;
                    });
                }
                else{
                    location.reload();
                }
            }
        
            
        }
    );
    }

}

async function deleteActivePacket(id_select){

    let packet = document.getElementById(id_select).value;
    options = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    }

    if(checkID.test(packet)){
        await fetch(`http://localhost:3000/packets/${packet}?admin=${uidAdmin}`,options)
        .then(data => {

            if((data.admin!=null && data.admin!=undefined) && data.admin==false){
                alert(data.msg);
                logout();
    
            } else{
                if(data.error){
                
                    document.getElementById("menu").classList.add("z-1");
                    document.getElementById("window_error").classList.remove("d-none");
                    document.getElementById("window_special").classList.add("d-none");
                    document.getElementById("window_packet").classList.add("d-none");
    
                    let list = document.getElementById("msg_list");
    
                    list.innerHTML=""; //Inizializzo la lista dei messaggi di errore
    
                    data.msg.forEach(element => {
                        list.innerHTML+=`<li class="m-2">${element}</li>`;
                    });
                }
                else{
                    location.reload();
                }
            }
        
           
        }
      );
    }

}

function logout(){
    localStorage.removeItem("uid");
    window.location.href="./index.html";
}

