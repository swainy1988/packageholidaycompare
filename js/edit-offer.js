// ======================================================
// PackageHolidayCompare
// Edit Holiday Offer
// ======================================================

let offerId = null;

document.addEventListener("DOMContentLoaded", async () => {

    const form =
        document.getElementById("offerForm");

    const params =
        new URLSearchParams(
            window.location.search
        );

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

    await Promise.all([
        loadHotels(),
        loadSuppliers()
    ]);

    await loadOffer();

});


// ======================================================
// LOAD HOTELS
// ======================================================

async function loadHotels() {

    const hotelSelect =
        document.getElementById(
            "hotel"
        );

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

    hotelSelect.innerHTML = `
        <option value="">
            Loading hotels...
        </option>
    `;

    const {
        data: hotels,
        error
    } = await window.db
        .from("hotels")
        .select("id, name")
        .order(
            "name",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "Failed to load hotels:",
            error
        );

        hotelSelect.innerHTML = `
            <option value="">
                Failed to load hotels
            </option>
        `;

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

    (hotels || []).forEach(
        hotel => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                hotel.id;

            option.textContent =
                hotel.name;

            hotelSelect.appendChild(
                option
            );

        }
    );

}


// ======================================================
// LOAD SUPPLIERS
// ======================================================

async function loadSuppliers() {

    const supplierSelect =
        document.getElementById(
            "supplier"
        );

    if (!supplierSelect) {
        return;
    }

    if (!window.db) {

        supplierSelect.innerHTML = `
            <option value="">
                Supabase is not connected
            </option>
        `;

        return;

    }

    supplierSelect.innerHTML = `
        <option value="">
            Loading suppliers...
        </option>
    `;

    const {
        data: suppliers,
        error
    } = await window.db
        .from("suppliers")
        .select("id, name, active")
        .order(
            "name",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "Failed to load suppliers:",
            error
        );

        supplierSelect.innerHTML = `
            <option value="">
                Failed to load suppliers
            </option>
        `;

        return;

    }

    supplierSelect.innerHTML = `
        <option value="">
            Select supplier
        </option>
    `;

    (suppliers || []).forEach(
        supplier => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                supplier.name;

            option.textContent =
                supplier.active
                    ? supplier.name
                    : `${supplier.name} (Inactive)`;

            supplierSelect.appendChild(
                option
            );

        }
    );

}


// ======================================================
// LOAD EXISTING OFFER
// ======================================================

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
        .eq(
            "id",
            offerId
        )
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

    document.getElementById(
        "hotel"
    ).value =
        offer.hotel_id || "";

    document.getElementById(
        "supplier"
    ).value =
        offer.supplier || "";

    document.getElementById(
        "price"
    ).value =
        offer.price ?? "";

    document.getElementById(
        "departure"
    ).value =
        offer.departure_date || "";

    document.getElementById(
        "airport"
    ).value =
        offer.airport || "";

    document.getElementById(
        "nights"
    ).value =
        offer.nights ?? "";

    document.getElementById(
        "board"
    ).value =
        offer.board_basis || "";

    document.getElementById(
        "roomType"
    ).value =
        offer.room_type || "";

    document.getElementById(
        "bookingUrl"
    ).value =
        offer.booking_url || "";

    if (button) {

        button.disabled = false;

        button.textContent =
            "Update Holiday Offer";

    }

}


// ======================================================
// UPDATE OFFER
// ======================================================

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
        ).value.trim();

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

    showMessage(
        "",
        false
    );

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
            boardBasis || null,

        room_type:
            roomType || null,

        booking_url:
            bookingUrl || null

    };

    const {
        error
    } = await window.db
        .from("holiday_offers")
        .update(
            updatedOffer
        )
        .eq(
            "id",
            offerId
        );

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

    setTimeout(
        () => {

            window.location.href =
                "holiday-offers.html";

        },
        800
    );

}


// ======================================================
// MESSAGE
// ======================================================

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