////////////////////////////////////////////////////////////////////

//                GOOGLE MAPS API ADD AO SEU SITE             //

//                        BY: RICKDEV                        //

//////////////////////////////////////////////////////////////////




window.onload = function(){ // Executar a pôs o carregamento do site//

    var map;





    function initialize(){ //Iniciando meu map Funcção//

        // Pega as configurações do mapa via varivael//

        var maProp = {


            center: new google.maps.LatLng(-22.932924,-47.073845),
            scrollwheel:false,
            zoom:16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }

        //Pegando a variavel map , puxando as info do mapa é setando na class map html
        map = new google.maps.Map(document.getElementById("map") , maProp)
    }

       //Função Personalizar 
    function addMarker(lat , long , icon , content){

        var latlng = {'lat':lat , 'lng': long};

        //criando um objeto e puxando da api map//

        var marker = new google.maps.Marker({

            position:latlng,
            map:map,
            icon:icon,

        });

            var infowindow = new google.maps.InfoWindow({

                content:content,
                maxWidth: 200,
               pixelOffset: new google.maps.Size(0 ,20)

            });

            // Ao clicar no icon do map , ele abre o endereço!//
            google.maps.event.addListener(marker,'click' , function(){
                infowindow.open(map,marker);

            });     

           

            
        }
        initialize(); //Inicializando meu mapa //

        var conteudo = '<p style="color:red; font-size: 12px; font-weight: bold;";>RicardoDev - FullStack</p> ';

        var icon = ''; // Add ou modificar icone via variavel//
        addMarker(-22.9353802,-47.092462 , icon , conteudo); // Setando latitudo e a longetitudo no icone do  endereço//

        // Definir um tempo para executar a função//
        setTimeout( function(){

            map.panTo({'lat':-22.9353802 , 'lng':-47.092462  }); // Efeito sair de um local e ir para seu endereço //

            map.setZoom(20); // Adicionar um zoom no mapa 

        },4000); // Tempo//

       
    }

    
