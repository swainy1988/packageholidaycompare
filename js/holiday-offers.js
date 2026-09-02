// ======================================================
// PackageHolidayCompare
// Holiday Offers Manager
// ======================================================

let allOffers = [];
let hotelNames = {};

document.addEventListener("DOMContentLoaded", () => {

    const searchInput =
        document.getElementById("searchOffers");

    if (searchInput) {

        searchInput.addEventListener("input", function () {

            const search =
                this.value.trim().toLowerCase();

            const filteredOffers =
                allOffers.filter(offer => {

                    const hotelName =
                        hotelNames[offer.hotel_id] || "";

                    const supplier =
                        offer.supplier || "";

                    const airport =
                        offer.airport || "";

                    const roomType =
                        offer.room_type || "";

                    return (
                        hotelName
                            .toLowerCase()
                            .includes(search) ||

                        supplier
                            .toLowerCase()
                            .includes(search) ||

                        airport
                            .toLowerCase()
                            .includes(search) ||

                        roomType
                            .toLowerCase()
                            .includes(search)
                    );

                });

            renderOffers(filteredOffers);

        });

    }

    loadOffers();

});


// ======================================================
// LOAD OFFERS
// ======================================================

async function loadOffers() {

    const table =
        document.getElementById("offersTable");

    if (!table) {

        console.error(
            "The offersTable element was not found."
        );

        return;

    }

    if (!window.db) {

        console.error(
            "Supabase is not connected."
        );

        table.innerHTML = `
            <tr>
                <td colspan="9">
                    Supabase connection is unavailable.
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML = `
        <tr>
            <td colspan="9">
                Loading offers...
            </td>
        </tr>
    `;

    try {

        // ==================================================
        // LOAD HOTEL NAMES
        // ==================================================

        const {
            data: hotels,
            error: hotelError
        } = await window.db
            .from("hotels")
            .select("id, name")
            .order("name", {
                ascending: true
            });

        if (hotelError) {
            throw hotelError;
        }

        hotelNames = {};

        (hotels || []).forEach(hotel => {

            hotelNames[hotel.id] =
                hotel.name;

        });


        // ==================================================
        // LOAD HOLIDAY OFFERS
        // ==================================================

        const {
            data: offers,
            error: offersError
        } = await window.db
            .from("holiday_offers")
            .select("*")
            .order("departure_date", {
                ascending: true
            });

        if (offersError) {
            throw offersError;
        }

        allOffers =
            offers || [];

        renderOffers(
            allOffers
        );

    } catch (error) {

        console.error(
            "Failed to load holiday offers:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="9">
                    Failed to load offers.
                </td>
            </tr>
        `;

    }

}


// ======================================================
// RENDER OFFERS
// ======================================================

function renderOffers(offers) {

    const table =
        document.getElementById("offersTable");

    if (!table) {
        return;
    }

    table.innerHTML = "";

    if (!offers.length) {

        table.innerHTML = `
            <tr>
                <td colspan="9">
                    No holiday offers found.
                </td>
            </tr>
        `;

        return;

    }

    offers.forEach(offer => {

        const hotelName =
            hotelNames[offer.hotel_id] ||
            "Unknown hotel";

        const price =
            Number(
                offer.price || 0
            ).toLocaleString(
                "en-GB",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            );

        const roomType =
            offer.room_type
                ? escapeHtml(
                    offer.room_type
                )
                : "-";

        const bookingUrl =
            createSafeBookingUrl(
                offer.booking_url
            );

        const bookingLink =
            bookingUrl
                ? `
                    <a
                        class="btn btn-small"
                        href="${bookingUrl}"
                        target="_blank"
                        rel="noopener"
                    >
                        View Link
                    </a>
                `
                : `
                    <span
                        style="
                            color:#777;
                            font-size:13px;
                            font-weight:600;
                        "
                    >
                        No link
                    </span>
                `;

        table.insertAdjacentHTML(
            "beforeend",
            `
                <tr>

                    <td>
                        ${escapeHtml(
                            hotelName
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            offer.supplier || "-"
                        )}
                    </td>

                    <td>
                        £${price}
                    </td>

                    <td>
                        ${formatDate(
                            offer.departure_date
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            offer.airport || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            offer.nights ?? "-"
                        )}
                    </td>

                    <td>
                        ${roomType}
                    </td>

                    <td>
                        ${bookingLink}
                    </td>

                    <td>

                        <a
                            class="btn btn-small"
                            href="edit-offer.html?id=${encodeURIComponent(
                                offer.id
                            )}"
                        >
                            Edit
                        </a>

                        <button
                            type="button"
                            class="btn-red"
                            onclick="deleteOffer('${escapeAttribute(
                                offer.id
                            )}')"
                        >
                            Delete
                        </button>

                    </td>

                </tr>
            `
        );

    });

}


// ======================================================
// DELETE OFFER
// ======================================================

async function deleteOffer(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this holiday offer?"
        );

    if (!confirmed) {
        return;
    }

    if (!window.db) {

        alert(
            "Supabase is not connected."
        );

        return;

    }

    const { error } =
        await window.db
            .from("holiday_offers")
            .delete()
            .eq("id", id);

    if (error) {

        console.error(
            "Failed to delete offer:",
            error
        );

        alert(
            "The holiday offer could not be deleted."
        );

        return;

    }

    await loadOffers();

}


// ======================================================
// BOOKING URL
// ======================================================

function createSafeBookingUrl(value) {

    const url =
        String(
            value || ""
        ).trim();

    if (
        url.startsWith("https://") ||
        url.startsWith("http://")
    ) {

        return escapeAttribute(
            url
        );

    }

    return "";

}


// ======================================================
// DATE FORMAT
// ======================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(
            `${String(value).slice(0, 10)}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHtml(
            value
        );

    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ======================================================
// HTML SAFETY
// ======================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHtml(
        value
    );

}