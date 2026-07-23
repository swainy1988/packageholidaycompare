// ======================================================
// PackageHolidayCompare
// Add Holiday Offer
// ======================================================

async function loadHotels() {

    if (!window.db) {
        alert("Supabase is not connected.");
        return;
    }

    const hotelSelect = document.getElementById("hotel");

    const { data, error } = await window.db
        .from("hotels")
        .select("id,name")
        .order("name");

    if (error) {

        console.error(error);
        alert(error.message);
        return;

    }

    hotelSelect.innerHTML = "";

    data.forEach(hotel => {

        hotelSelect.innerHTML += `
            <option value="${hotel.id}">
                ${hotel.name}
            </option>
        `;

    });

}

async function saveOffer() {

    const hotel_id = document.getElementById("hotel").value;
    const supplier = document.getElementById("supplier").value;
    const price = Number(document.getElementById("price").value);
    const departure_date = document.getElementById("departure").value;
    const airport = document.getElementById("airport").value;
    const nights = Number(document.getElementById("nights").value);
    const board_basis = document.getElementById("board").value;
    const booking_url = document.getElementById("booking").value;

    if (!hotel_id || !supplier || !price || !departure_date) {

        alert("Please complete all required fields.");

        return;

    }

    const { error } = await window.db
        .from("holiday_offers")
        .insert([{

            hotel_id,
            supplier,
            price,
            departure_date,
            airport,
            nights,
            board_basis,
            booking_url

        }]);

    if (error) {

        console.error(error);
        alert(error.message);
        return;

    }

    alert("✅ Holiday offer added successfully!");

    window.location = "holiday-offers.html";

}

document.addEventListener("DOMContentLoaded", () => {

    loadHotels();

});