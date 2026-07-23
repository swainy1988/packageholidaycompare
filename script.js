let adults = 2;
let children = 0;



function changeAdults(amount){

    adults += amount;

    if(adults < 1){
        adults = 1;
    }

    document.getElementById("adultCount").innerHTML = adults;

}





function changeChildren(amount){

    children += amount;


    if(children < 0){
        children = 0;
    }


    document.getElementById("childCount").innerHTML = children;



    let ages = document.getElementById("childAges");

    ages.innerHTML = "";



    for(let i = 1; i <= children; i++){


        ages.innerHTML += `

        <div class="field">

        <label>
        Child ${i} age
        </label>


        <select class="childAge">


        <option value="">
        Select age
        </option>

        ${Array.from({length:18}, (_,age)=>`
        <option value="${age}">
        ${age}
        </option>
        `).join("")}


        </select>

        </div>

        `;

    }

}






function searchHolidays(){



let airport =
document.getElementById("airport").value;



let destination =
document.getElementById("destination").value;



let nights =
document.getElementById("nights").value;



let board =
document.getElementById("board").value;



let budget =
document.getElementById("budget").value;





let dateType =
document.querySelector('input[name="dateType"]:checked').value;



let date = "";

let month = "";





if(dateType === "exact"){


date =
document.getElementById("date").value;


}

else{


month =
document.getElementById("travelMonth").value;


}






let childAges=[];



document.querySelectorAll(".childAge").forEach(function(age){


childAges.push(age.value);


});








localStorage.setItem("airport", airport);


localStorage.setItem("destination", destination);


localStorage.setItem("nights", nights);


localStorage.setItem("board", board);


localStorage.setItem("budget", budget);


localStorage.setItem("adults", adults);


localStorage.setItem("children", children);


localStorage.setItem("childAges", JSON.stringify(childAges));



localStorage.setItem("dateType", dateType);


localStorage.setItem("date", date);


localStorage.setItem("travelMonth", month);






window.location.href="results.html";

}