// ======================================================
// PackageHolidayCompare
// Add Holiday Offer
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    const form =
        document.getElementById("offerForm");

    if (form) {

        form.addEventListener(
            "submit",
            saveOffer
        );

    }

    await Promise.all([
        loadHotels(),
        loadSuppliers()
    ]);

});


// ======================================================
// LOAD HOTELS
// ======================================================

async function loadHotels() {

    const hotelSelect =
        document.getElementById("hotel");

    if (!hotelSelect) {
        return;
    }

    if (!window.db) {

        hotelSelect.innerHTML = `
            <option value="">
                Supabase is not connected
            </option>
        `;

        console.error(
            "Supabase is not connected."
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

        return;

    }

    hotelSelect.innerHTML = `
        <option value="">
            Select hotel
        </option>
    `;

    (hotels || []).forEach(hotel => {

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

    });

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
        .eq(
            "active",
            true
        )
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
                supplier.name;

            supplierSelect.appendChild(
                option
            );

        }
    );

}


// ======================================================
// SAVE OFFER
// ======================================================

async function saveOffer(event) {

    event.preventDefault();

    const button =
        document.getElementById(
            "saveOfferButton"
        );

    if (!window.db) {

        showMessage(
            "Supabase is not connected.",
            true
        );

        return;

    }

    const hotelId =
        document.getElementById(
            "hotel"
        ).value;

    const supplier =
        document.getElementById(
            "supplier"
        ).value.trim();

    const priceValue =
        document.getElementById(
            "price"
        ).value;

    const departureDate =
        document.getElementById(
            "departure"
        ).value;

    const airport =
        document.getElementById(
            "airport"
        ).value.trim();

    const nightsValue =
        document.getElementById(
            "nights"
        ).value;

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

    const price =
        Number(priceValue);

    const nights =
        Number(nightsValue);

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
        "Saving...";

    showMessage(
        "",
        false
    );

    const offer = {

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
        .insert([
            offer
        ]);

    if (error) {

        console.error(
            "Failed to save offer:",
            error
        );

        showMessage(
            error.message,
            true
        );

        button.disabled = false;

        button.textContent =
            "Save Holiday Offer";

        return;

    }

    showMessage(
        "Holiday offer added successfully.",
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