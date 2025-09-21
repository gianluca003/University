const uidUser = localStorage.getItem("uid");
const checkID = /^[a-f0-9]{24}$/;

function authAccess(){

    if(uidUser==null ||uidUser==undefined || !checkID.test(uidUser)){
        alert("Unauthorized access");
        return false;   
    }
    return true;
}


function getInformations(){

    let query = window.location.search;
    let param = new URLSearchParams(query);
    const events_id = param.get('event');
    let waiting_window = document.getElementById('waiting');
    let events = document.getElementById('events');
    let characters = document.getElementById('characters');
    let comics = document.getElementById('comics');
    let series = document.getElementById('series');
    let stories = document.getElementById('stories');
    let d;
    let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    if(!authAccess()){
        logout();

    } else{
        document.getElementById("menu").classList.add("z-1");
        waiting_window.classList.remove("d-none");

        fetch(`http://localhost:3000/events/${events_id}`)
        .then(response => response.json())
        .then(data =>{

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

                document.getElementById('title').innerText=data.informations.title;
                document.getElementById('description').innerText=data.informations.description;
                document.getElementById('image').src = data.informations.image;

                if(data.informations.previous!=null){
                    document.getElementById('previous').innerText=data.informations.previous.name;
                    id_link = data.informations.previous.resourceURI.split('/');
                    document.getElementById('prev_link').href=`./events.html?event=${id_link[id_link.length-1]}`;
                }
                

                if(data.informations.next!=null){
                    document.getElementById('next').innerText=data.informations.next.name;
                    id_link = data.informations.next.resourceURI.split('/');
                    document.getElementById('next_link').href=`./events.html?event=${id_link[id_link.length-1]}`;
                }

                if(data.informations.start!=null){
                    d=new Date(data.informations.start);
                document.getElementById('start').innerText=d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear();
                }
                
                if(data.informations.end){
                    d=new Date(data.informations.end);
                document.getElementById('end').innerText=d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear();
                }
                
                document.getElementById('creators').innerText='';

                for(let i=0; i<data.informations.creators.length;i++){
                    document.getElementById('creators').innerText+=data.informations.creators[i].name+` (${data.informations.creators[i].role})`;

                    if(i!=data.informations.creators.length-1)
                        document.getElementById('creators').innerHTML+=',&nbsp';
                }

                stories.innerHTML = '';

                data.informations.stories.forEach( element => {
                    id_link = element.resourceURI.split('/');
                    stories.innerHTML+=`<a class="col-lg-2 col-md-4 col-12 text-decoration-none m-2 text-center"  href='./stories.html?story=${id_link[id_link.length-1]}'> <span class="custom-a-details ">${element.name}s</span></a>`;
                });

                characters.innerHTML='';

                data.informations.characters.forEach( element => {
                    id_link = element.resourceURI.split('/');
                    characters.innerHTML+=`<a class="col-lg-2 col-md-4 col-12 text-decoration-none m-2 text-center"  href='./details.html?hero=${id_link[id_link.length-1]}'> <span class="custom-a-details ">${element.name}s</span></a>`;
                });

                comics.innerHTML = '';

                data.informations.comics.forEach( element => {
                    id_link = element.resourceURI.split('/');
                    comics.innerHTML+=`<a class="col-lg-2 col-md-4 col-12 text-decoration-none m-2 text-center" href='./comics.html?comic=${id_link[id_link.length-1]}'> <span class="custom-a-details ">${element.name}s</span></a>`;
                });

                series.innerHTML = '';

                data.informations.series.forEach( element => {
                    id_link = element.resourceURI.split('/');
                    series.innerHTML+=`<a class="col-lg-2 col-md-4 col-12 text-decoration-none m-2 text-center" href='./series.html?serie=${id_link[id_link.length-1]}'> <span class="custom-a-details ">${element.name}s</span></a>`;
                });

            }
        });
    }

}


function logout(){
    localStorage.removeItem("uid");
    window.location.href="./index.html";
}