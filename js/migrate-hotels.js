// ======================================================
// PackageHolidayCompare
// Hotel Migration Tool
// ======================================================

async function migrateHotels() {

    const output = document.getElementById("output");

    output.textContent = "Reading holidays table...\n";

    const { data: holidays, error } = await window.db
        .from("holidays")
        .select("*")
        .order("name");

    if (error) {
        output.textContent += "\nERROR:\n" + error.message;
        return;
    }

    output.textContent += `Found ${holidays.length} holiday records.\n\n`;

    let imported = 0;
    let skipped = 0;

    for (const hotel of holidays) {

        // Check if hotel already exists
        const { data: existing } = await window.db
            .from("hotels")
            .select("id")
            .eq("name", hotel.name)
            .limit(1);

        if (existing && existing.length > 0) {
            skipped++;
            output.textContent += `Skipped: ${hotel.name}\n`;
            continue;
        }

        const { error: insertError } = await window.db
            .from("hotels")
            .insert({

                name: hotel.name,
               slug: hotel.name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
                country: hotel.country,
                destination: hotel.destination || hotel.location,
                region: hotel.region,
                stars: hotel.stars,
                board_basis: hotel.board,
                description: hotel.description,
                airport: hotel.airport,
                transfer_time: hotel.transfertime || hotel.transfer_time,
                main_image: hotel.image,
                gallery: [],
                facilities: hotel.facilities || [],
                room_types: hotel.roomtypes || []

            });

        if (insertError) {

            output.textContent +=
                `❌ ${hotel.name} : ${insertError.message}\n`;

        } else {

            imported++;

            output.textContent +=
                `✅ Imported ${hotel.name}\n`;

        }

    }

    output.textContent +=
`\n--------------------------------

Imported : ${imported}

Skipped : ${skipped}

Finished ✔`;
}

document
.getElementById("migrateBtn")
.addEventListener("click", migrateHotels);