// ======================================================
// PackageHolidayCompare
// Edit Holiday Offer
// ======================================================

let offerId = null;

document.addEventListener("DOMContentLoaded", async () => {

    const form =
        document.getElementById("offerForm");

    const params =
        new URLSearchParams(window.location.search);

    offerId =
        params.get("id");

    if (!offerId) {

        showMessage(
            "No holiday offer was selected.",
            true
        );

        return;

    }

    if (form) {

        form.addEventListener(
            "submit",
            updateOffer
        );

    }

    await loadHotels();

    await loadOffer();

});

async function loadHotels() {

    const hotelSelect =
        document.getElementById("hotel");

    if (!hotelSelect) {
        return;
    }

    if (!window.db) {

        showMessage(
            "Supabase is not connected.",
            true
        );

        return;

    }

    const {
        data: hotels,
        error
    } = await window.db
        .from("hotels")
        .select("id, name")
        .order("name", {
            ascending: true
        });

    if (error) {

        console.error(
            "Failed to load hotels:",
            error
        );

        showMessage(
            "Hotels could not be loaded.",
            true
        );

        return;

    }

    hotelSelect.innerHTML = `
        <option value="">
            Select hotel
        </option>
    `;

    (hotels || []).forEach(hotel => {

        const option =
            document.createElement("option");

        option.value =
            hotel.id;

        option.textContent =
            hotel.name;

        hotelSelect.appendChild(option);

    });

}

async function loadOffer() {

    if (!window.db) {

        showMessage(
            "Supabase is not connected.",
            true
        );

        return;

    }

    const button =
        document.getElementById(
            "saveOfferButton"
        );

    if (button) {

        button.disabled = true;

        button.textContent =
            "Loading...";

    }

    const {
        data: offer,
        error
    } = await window.db
        .from("holiday_offers")
        .select("*")
        .eq("id", offerId)
        .single();

    if (error) {

        console.error(
            "Failed to load holiday offer:",
            error
        );

        showMessage(
            "The holiday offer could not be loaded.",
            true
        );

        if (button) {

            button.textContent =
                "Update Holiday Offer";

        }

        return;

    }

    document.getElementById("hotel").value =
        offer.hotel_id || "";

    document.getElementById("supplier").value =
        offer.supplier || "";

    document.getElementById("price").value =
        offer.price ?? "";

    document.getElementById("departure").value =
        offer.departure_date || "";

    document.getElementById("airport").value =
        offer.airport || "";

    document.getElementById("nights").value =
        offer.nights ?? "";

    document.getElementById("board").value =
        offer.board_basis || "";

    document.getElementById("roomType").value =
        offer.room_type || "";

    document.getElementById("bookingUrl").value =
        offer.booking_url || "";

    if (button) {

        button.disabled = false;

        button.textContent =
            "Update Holiday Offer";

    }

}

async function updateOffer(event) {

    event.preventDefault();

    if (!window.db) {

        showMessage(
            "Supabase is not connected.",
            true
        );

        return;

    }

    const button =
        document.getElementById(
            "saveOfferButton"
        );

    const hotelId =
        document.getElementById(
            "hotel"
        ).value;

    const supplier =
        document.getElementById(
            "supplier"
        ).value;

    const price =
        Number(
            document.getElementById(
                "price"
            ).value
        );

    const departureDate =
        document.getElementById(
            "departure"
        ).value;

    const airport =
        document.getElementById(
            "airport"
        ).value;

    const nights =
        Number(
            document.getElementById(
                "nights"
            ).value
        );

    const boardBasis =
        document.getElementById(
            "board"
        ).value;

    const roomType =
        document.getElementById(
            "roomType"
        ).value.trim();

    const bookingUrl =
        document.getElementById(
            "bookingUrl"
        ).value.trim();

    if (
        !hotelId ||
        !supplier ||
        !departureDate ||
        !airport
    ) {

        showMessage(
            "Please complete all required fields.",
            true
        );

        return;

    }

    if (
        !Number.isFinite(price) ||
        price <= 0
    ) {

        showMessage(
            "Please enter a valid price.",
            true
        );

        return;

    }

    if (
        !Number.isInteger(nights) ||
        nights < 1
    ) {

        showMessage(
            "Please enter a valid number of nights.",
            true
        );

        return;

    }

    button.disabled = true;

    button.textContent =
        "Updating...";

    const updatedOffer = {

        hotel_id:
            hotelId,

        supplier:
            supplier,

        price:
            price,

        departure_date:
            departureDate,

        airport:
            airport,

        nights:
            nights,

        board_basis:
            boardBasis,

        room_type:
            roomType || null,

        booking_url:
            bookingUrl || null

    };

    const { error } =
        await window.db
            .from("holiday_offers")
            .update(updatedOffer)
            .eq("id", offerId);

    if (error) {

        console.error(
            "Failed to update holiday offer:",
            error
        );

        showMessage(
            error.message,
            true
        );

        button.disabled = false;

        button.textContent =
            "Update Holiday Offer";

        return;

    }

    showMessage(
        "Holiday offer updated successfully.",
        false
    );

    setTimeout(() => {

        window.location.href =
            "holiday-offers.html";

    }, 800);

}

function showMessage(
    text,
    isError
) {

    const message =
        document.getElementById(
            "formMessage"
        );

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.style.marginTop =
        "15px";

    message.style.color =
        isError
            ? "#d32f2f"
            : "#00875a";

}