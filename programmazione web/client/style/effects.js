
//Passo alla funzione l'elemento bottone + l'id dell'input per cambiare il type
//Uso questo soluzione per rendere la funzione versatile e usabile da più elementi
//come ad esempio dal verify password, senza essere vincolati dagli id 
function activePasswordEye(element,id){

    let closeEye = element.firstElementChild;
    let openEye = element.lastElementChild;
    let password = document.getElementById(id);

    if(closeEye.classList.contains("d-none")){

        closeEye.classList.remove("d-none");
        openEye.classList.add("d-none");
        password.type = "text";

    } else{
        closeEye.classList.add("d-none");
        openEye.classList.remove("d-none");
        password.type = "password";
    }
}

//################ PROFILE PAGE ################
//Effetti per muoversi all'interno della navbar

function activeProfileSettings(){

    //Tolgo/Aggiungo in ogni caso le classi perché non so quale tab sia attiva in un determinato periodo

    document.getElementById("profile-settings-tab").classList.remove("text-white");
    document.getElementById("profile-settings-tab").classList.add("custom-bg-light-grey");
    document.getElementById("profile-settings-tab").classList.add("text-dark");

    document.getElementById("credit-card-tab").classList.remove("custom-bg-light-grey"); 
    document.getElementById("credit-card-tab").classList.remove("text-dark")
    document.getElementById("credit-card-tab").classList.add("text-white");

    document.getElementById("profile-settings-menu").classList.remove("d-none");
    document.getElementById("credit-card-menu").classList.add("d-none");
}

function activeCreditCard(){
    document.getElementById("profile-settings-tab").classList.remove("custom-bg-light-grey"); 
    document.getElementById("profile-settings-tab").classList.remove("text-dark")
    document.getElementById("profile-settings-tab").classList.add("text-white"); 

    document.getElementById("credit-card-tab").classList.remove("text-white");
    document.getElementById("credit-card-tab").classList.add("custom-bg-light-grey"); 
    document.getElementById("credit-card-tab").classList.add("text-dark");


    document.getElementById("profile-settings-menu").classList.add("d-none");
    document.getElementById("credit-card-menu").classList.remove("d-none");
}


function expireCreditCard(){
    let date = document.getElementById("expire_creditCard");
   
    if( date.value[2]!='/' && date.value.length==2)
        date.value += '/';
}

//################ ADMIN PAGE ################

function openWindow(id_window, id_menu){
  document.getElementById(id_window).classList.remove("d-none");
  document.getElementById(id_menu).classList.add("z-1");
}

function closeWindow(id_window, id_menu){
    document.getElementById(id_window).classList.add("d-none");
    document.getElementById(id_menu).classList.remove("z-1");
}

//################ ALBUM PAGE ################
function resizeScreen(){

    let iconMin = document.getElementById("iconMin");
    let iconFull = document.getElementById("iconFull");
    let text = document.getElementById("fullScreenText");
    let menu = document.getElementById("menu");
    let footer = document.getElementById("footer");

    if(iconMin.classList.contains("d-none")){

        iconMin.classList.remove("d-none");
        iconFull.classList.add("d-none");
        text.innerText="Minimize";
        menu.classList.add("d-none");
        footer.classList.add("d-none");

    } else{

        iconFull.classList.remove("d-none");
        iconMin.classList.add("d-none");
        text.innerText = "Full screen";
        menu.classList.remove("d-none");
        footer.classList.remove("d-none");
    }
}

//################ SHOP PAGE ################

function calculateMoney(){
    let coins = document.getElementById("album-coins");
    let euro = document.getElementById("cost-euro");

    //1 coins = 50 cent
    euro.innerText = coins.value/2+" €";
}

//################ SIGN UP PAGE ################
//fa comparire il menu dei supereroi
function handleSelectHeros(hero_button,hero_menu){

    let button = document.getElementById(hero_button);
    let list = document.getElementById(hero_menu);

    if(list.classList.contains('d-none')){
        list.classList.remove('d-none');
        button.classList.add('custom-rounded-top');
    }
    else {
        list.classList.add('d-none');
        button.classList.remove('custom-rounded-top');
    }
}

//################ TRADE PAGE ################


function createSections(form, icon_open, icon_close, button ){

    if(document.getElementById(form).classList.contains('d-none')){
        document.getElementById(form).classList.remove('d-none');
        document.getElementById(icon_open).classList.remove('d-none');
        document.getElementById(icon_close).classList.add('d-none');
        document.getElementById(button).classList.add('d-none'); //Se si schiaccia offer, viene nasconto il button request, e viceversa
    }
       
    else{
        document.getElementById(form).classList.add('d-none')
        document.getElementById(icon_open).classList.add('d-none');
        document.getElementById(icon_close).classList.remove('d-none');
        document.getElementById(button).classList.remove('d-none');
    }
}

function openSelectDeals(id_search, close_icon, open_icon){

    let search = document.getElementById(id_search);
    let close = document.getElementById(close_icon);
    let open = document.getElementById(open_icon);

    if(close.classList.contains('d-none')){

        open.classList.add('d-none');
        close.classList.remove('d-none');
        search.classList.add('d-none');
    } else{

        open.classList.remove('d-none');
        close.classList.add('d-none');
        search.classList.remove('d-none');
    }

}



function search(id_search,id_searchMenu){

    let searchBar = document.getElementById(id_search);
    let searchMenu = document.getElementById(id_searchMenu);
    let search_type;
    let items = '';
    let object;

    const keywords_not_logged = [
        {title: 'Homepage' ,keywords: ['homepage','posts','index'], path: './index.html'},
        {title: 'Developer docs' ,keywords: ['documentation','api','server','description','developer docs'], path:'http://localhost:3000/api-docs/'},
        {title:'Shop',keywords: ['cards','heros','discover','buy','purchase','credits','payment','packets','new','shop'], path:'./shop.html'},
        {title: 'Login', keywords:['users','login','password','username','account'], path:'./login.html'},
        {title:'Sign up',keywords:['sign up','account','password','username','email','favourite heros','users','create','first name','last name'], path:'./signup.html'}
    ];
   
    const keywords_logged = [
        {title:'Homepage',keywords: ['homepage','posts','index'], path: './index.html'},
        {title:'Album',keywords: ['album','cards','heros','rarity','legendary','mythic','heroic','super','common','statistics','pages'], path:'./album.html'},
        {title:'Profile',keywords:['profile','email','account','first name','last name','username','payment','password','security','credit card','informations','favourite heros','credits','cards','date','delete','remove','update','users','total'],path:'./profile.html'},
        {title:'Trades',keywords:['trades','offer','request','my deals','my offers','cards','credits','sale','credits','buy','heros','generics','heros','create'],path:'./trades.html'},
        {title:'Shop',keywords: ['shop','cards','heros','discover','buy','purchase','credits','payment','packets','new'], path:'./shop.html'},
        {title:'Developer docs' ,keywords: ['developer docs','documentation','api','server','description'], path:'http://localhost:3000/api-docs/'}
    ];

    //Alcune pagine i possono cercare solo se si è loggati. Ma in ogni caso ogni pagina controllerà se
    //è stato effetuato un login correttamente.
    if(localStorage.getItem("uid") != null && localStorage.getItem("uid") != undefined && localStorage.getItem("uid") != NaN)
        search_type=keywords_logged;
    else 
        search_type=keywords_not_logged;

        searchMenu.innerHTML='';

        if(searchBar.value.length>0){
            search_type.forEach( obj =>{

                object=null;
    
              //Controllo se un oggetto contiene la parola chiave cercata
              for(let i=0, find=false; i<obj.keywords.length && !find;i++){
                    if(obj.keywords[i].includes(searchBar.value.toLowerCase())){
                        object = obj;
                        find=true;
                    }
              }
    
              if(object!=undefined && object!=null)
                items+=`<a class='d-block dropdown-item custom-font-light' href='${object.path}'>${object.title}</a>`;
            });
    
            searchMenu.innerHTML=items;
            searchMenu.classList.remove('d-none');
        } else
            searchMenu.classList.add('d-none');
}

