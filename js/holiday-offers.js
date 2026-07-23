// ======================================================
// PackageHolidayCompare
// Holiday Offers Manager
// ======================================================

let offers = [];

async function loadOffers() {

    if (!window.db) {
        console.error("Supabase not connected.");
        return;
    }

    const tbody = document.getElementById("offerTable");

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7">Loading offers...</td>
        </tr>
    `;

    const { data, error } = await window.db
        .from("holiday_offers")
        .select(`
            *,
            hotels (
                name
            )
        `)
        .order("departure_date", { ascending: true });

    if (error) {

        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7">Failed to load offers.</td>
            </tr>
        `;

        return;

    }

    offers = data;

    renderOffers(offers);

}

function renderOffers(list) {

    const tbody = document.getElementById("offerTable");

    tbody.innerHTML = "";

    if (list.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    No holiday offers found.
                </td>
            </tr>
        `;

        return;

    }

    list.forEach(offer => {

        tbody.innerHTML += `
            <tr>

                <td>${offer.hotels?.name || "-"}</td>

                <td>${offer.supplier || "-"}</td>

                <td>£${offer.price || 0}</td>

                <td>${offer.departure_date || "-"}</td>

                <td>${offer.airport || "-"}</td>

                <td>${offer.nights || "-"}</td>

                <td>

                    <button
                        class="btn btn-small"
                        onclick="editOffer('${offer.id}')">

                        Edit

                    </button>

                    <button
                        class="btn btn-danger btn-small"
                        onclick="deleteOffer('${offer.id}')">

                        Delete

                    </button>

                </td>

            </tr>
        `;

    });

}

function editOffer(id){

    window.location =
        "edit-offer.html?id=" + id;

}

async function deleteOffer(id){

    if(!confirm("Delete this offer?"))
        return;

    const { error } = await window.db
        .from("holiday_offers")
        .delete()
        .eq("id", id);

    if(error){

        alert(error.message);
        return;

    }

    loadOffers();

}

document.addEventListener("DOMContentLoaded", ()=>{

    const search =
        document.getElementById("searchOffer");

    if(search){

        search.addEventListener("input", function(){

            const value =
                this.value.toLowerCase();

            const filtered =
                offers.filter(o =>

                    (o.hotels?.name || "")
                    .toLowerCase()
                    .includes(value)

                    ||

                    (o.supplier || "")
                    .toLowerCase()
                    .includes(value)

                    ||

                    (o.airport || "")
                    .toLowerCase()
                    .includes(value)

                );

            renderOffers(filtered);

        });

    }

    loadOffers();

});