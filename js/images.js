// ======================================================
// PackageHolidayCompare
// Hotel Images Manager
// Version: 2026-09-02-1
// ======================================================

let selectedHotelId = "";
let currentImages = [];


// ======================================================
// START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    initialiseImagesManager
);


async function initialiseImagesManager() {

    const form =
        document.getElementById(
            "imageUploadForm"
        );

    const hotelSelect =
        document.getElementById(
            "hotelSelect"
        );

    if (!window.db) {

        showMessage(
            "Supabase is not connected.",
            true
        );

        return;
    }

    if (form) {

        form.addEventListener(
            "submit",
            uploadHotelImage
        );

    }

    if (hotelSelect) {

        hotelSelect.addEventListener(
            "change",
            handleHotelChange
        );

    }

    await loadHotels();

}


// ======================================================
// LOAD HOTELS
// ======================================================

async function loadHotels() {

    const hotelSelect =
        document.getElementById(
            "hotelSelect"
        );

    if (!hotelSelect) {
        return;
    }

    hotelSelect.innerHTML =
        `<option value="">
            Loading hotels...
        </option>`;

    try {

        const {
            data,
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
            throw error;
        }

        hotelSelect.innerHTML =
            `<option value="">
                Select a hotel
            </option>`;

        if (
            !data ||
            data.length === 0
        ) {

            hotelSelect.innerHTML =
                `<option value="">
                    No hotels found
                </option>`;

            return;
        }

        data.forEach(
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

    } catch (error) {

        console.error(
            "Hotel loading error:",
            error
        );

        hotelSelect.innerHTML =
            `<option value="">
                Unable to load hotels
            </option>`;

        showMessage(
            "Unable to load hotels.",
            true
        );

    }

}


// ======================================================
// HOTEL CHANGED
// ======================================================

async function handleHotelChange() {

    const hotelSelect =
        document.getElementById(
            "hotelSelect"
        );

    selectedHotelId =
        hotelSelect.value;

    currentImages = [];

    if (!selectedHotelId) {

        showEmptyLibrary(
            "Select a hotel to view its images."
        );

        return;

    }

    await loadHotelImages();

}


// ======================================================
// LOAD HOTEL IMAGES
// ======================================================

async function loadHotelImages() {

    if (!selectedHotelId) {
        return;
    }

    const container =
        document.getElementById(
            "hotelImages"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        `<div class="empty-images">
            Loading images...
        </div>`;

    try {

        const {
            data,
            error
        } = await window.db
            .from("hotel_images")
            .select(
                `
                    id,
                    hotel_id,
                    image_url,
                    storage_path,
                    alt_text,
                    is_main,
                    sort_order,
                    created_at
                `
            )
            .eq(
                "hotel_id",
                selectedHotelId
            )
            .order(
                "is_main",
                {
                    ascending: false
                }
            )
            .order(
                "sort_order",
                {
                    ascending: true
                }
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

        if (error) {
            throw error;
        }

        currentImages =
            data || [];

        renderHotelImages();

    } catch (error) {

        console.error(
            "Image loading error:",
            error
        );

        showEmptyLibrary(
            "Unable to load hotel images."
        );

    }

}


// ======================================================
// RENDER IMAGES
// ======================================================

function renderHotelImages() {

    const container =
        document.getElementById(
            "hotelImages"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (currentImages.length === 0) {

        showEmptyLibrary(
            "No images have been uploaded for this hotel yet."
        );

        return;
    }

    const grid =
        document.createElement(
            "div"
        );

    grid.className =
        "hotel-images-grid";

    currentImages.forEach(
        image => {

            const card =
                createImageCard(
                    image
                );

            grid.appendChild(
                card
            );

        }
    );

    container.appendChild(
        grid
    );

}


// ======================================================
// CREATE IMAGE CARD
// ======================================================

function createImageCard(image) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "hotel-image-card";


    // ==================================================
    // IMAGE
    // ==================================================

    const imageElement =
        document.createElement(
            "img"
        );

    imageElement.src =
        image.image_url;

    imageElement.alt =
        image.alt_text ||
        "Hotel image";

    imageElement.loading =
        "lazy";

    imageElement.addEventListener(
        "error",
        () => {

            imageElement.alt =
                "Image unavailable";

        }
    );

    card.appendChild(
        imageElement
    );


    // ==================================================
    // INFO
    // ==================================================

    const info =
        document.createElement(
            "div"
        );

    info.className =
        "hotel-image-info";


    if (image.is_main) {

        const badge =
            document.createElement(
                "div"
            );

        badge.className =
            "main-image-badge";

        badge.textContent =
            "Main Image";

        info.appendChild(
            badge
        );

    }


    const heading =
        document.createElement(
            "h3"
        );

    heading.textContent =
        image.alt_text ||
        "Hotel Image";

    info.appendChild(
        heading
    );


    const details =
        document.createElement(
            "p"
        );

    details.textContent =
        image.is_main
            ? "Used as the hotel's main image."
            : "Gallery image.";

    info.appendChild(
        details
    );


    // ==================================================
    // ACTIONS
    // ==================================================

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "image-actions";


    if (!image.is_main) {

        const mainButton =
            document.createElement(
                "button"
            );

        mainButton.type =
            "button";

        mainButton.className =
            "btn btn-primary btn-small";

        mainButton.textContent =
            "Set as Main";

        mainButton.addEventListener(
            "click",
            async () => {

                await setMainImage(
                    image
                );

            }
        );

        actions.appendChild(
            mainButton
        );

    }


    const deleteButton =
        document.createElement(
            "button"
        );

    deleteButton.type =
        "button";

    deleteButton.className =
        "btn btn-small";

    deleteButton.textContent =
        "Delete";

    deleteButton.addEventListener(
        "click",
        async () => {

            await deleteHotelImage(
                image
            );

        }
    );

    actions.appendChild(
        deleteButton
    );

    info.appendChild(
        actions
    );

    card.appendChild(
        info
    );

    return card;

}


// ======================================================
// UPLOAD IMAGE
// ======================================================

async function uploadHotelImage(event) {

    event.preventDefault();

    const hotelSelect =
        document.getElementById(
            "hotelSelect"
        );

    const fileInput =
        document.getElementById(
            "imageFile"
        );

    const altTextInput =
        document.getElementById(
            "altText"
        );

    const mainCheckbox =
        document.getElementById(
            "isMain"
        );

    const uploadButton =
        document.getElementById(
            "uploadImageButton"
        );


    const hotelId =
        hotelSelect.value;

    const file =
        fileInput.files[0];

    const altText =
        altTextInput.value.trim();

    const makeMain =
        mainCheckbox.checked;


    // ==================================================
    // VALIDATION
    // ==================================================

    if (!hotelId) {

        showMessage(
            "Please select a hotel.",
            true
        );

        return;

    }

    if (!file) {

        showMessage(
            "Please choose an image.",
            true
        );

        return;

    }

    if (
        file.type !==
        "image/jpeg"
    ) {

        showMessage(
            "Please choose a JPG or JPEG image.",
            true
        );

        return;

    }


    const maxFileSize =
        10 * 1024 * 1024;

    if (
        file.size >
        maxFileSize
    ) {

        showMessage(
            "The image must be 10 MB or smaller.",
            true
        );

        return;

    }


    uploadButton.disabled =
        true;

    uploadButton.textContent =
        "Uploading...";

    showMessage(
        "",
        false
    );


    let storagePath = "";


    try {

        // ==================================================
        // CREATE UNIQUE FILE NAME
        // ==================================================

        const fileId =
            createUniqueId();

        storagePath =
            `${hotelId}/${fileId}.jpg`;


        // ==================================================
        // UPLOAD TO SUPABASE STORAGE
        // ==================================================

        const {
            error: uploadError
        } = await window.db
            .storage
            .from(
                "hotel-images"
            )
            .upload(
                storagePath,
                file,
                {
                    contentType:
                        "image/jpeg",

                    cacheControl:
                        "3600",

                    upsert:
                        false
                }
            );

        if (uploadError) {
            throw uploadError;
        }


        // ==================================================
        // GET PUBLIC IMAGE URL
        // ==================================================

        const {
            data: publicUrlData
        } = window.db
            .storage
            .from(
                "hotel-images"
            )
            .getPublicUrl(
                storagePath
            );

        const imageUrl =
            publicUrlData
                ?.publicUrl;

        if (!imageUrl) {

            throw new Error(
                "Unable to create the image URL."
            );

        }


        // ==================================================
        // GET NEXT SORT ORDER
        // ==================================================

        const nextSortOrder =
            await getNextSortOrder(
                hotelId
            );


        // ==================================================
        // SAVE IMAGE RECORD
        // ==================================================

        const {
            data: insertedData,
            error: insertError
        } = await window.db
            .from(
                "hotel_images"
            )
            .insert(
                [
                    {
                        hotel_id:
                            hotelId,

                        image_url:
                            imageUrl,

                        storage_path:
                            storagePath,

                        alt_text:
                            altText || null,

                        is_main:
                            false,

                        sort_order:
                            nextSortOrder
                    }
                ]
            )
            .select()
            .single();

        if (insertError) {

            await removeStorageFile(
                storagePath
            );

            throw insertError;
        }


        // ==================================================
        // MAKE MAIN IMAGE IF REQUESTED
        // ==================================================

        if (makeMain) {

            await setMainImage(
                insertedData,
                false
            );

        }


        selectedHotelId =
            hotelId;

        fileInput.value =
            "";

        altTextInput.value =
            "";

        mainCheckbox.checked =
            false;


        showMessage(
            "Image uploaded successfully.",
            false
        );


        await loadHotelImages();

    } catch (error) {

        console.error(
            "Image upload failed:",
            error
        );

        showMessage(
            error?.message ||
            "Unable to upload the image.",
            true
        );

    } finally {

        uploadButton.disabled =
            false;

        uploadButton.textContent =
            "Upload Image";

    }

}


// ======================================================
// GET NEXT SORT ORDER
// ======================================================

async function getNextSortOrder(
    hotelId
) {

    const {
        data,
        error
    } = await window.db
        .from(
            "hotel_images"
        )
        .select(
            "sort_order"
        )
        .eq(
            "hotel_id",
            hotelId
        )
        .order(
            "sort_order",
            {
                ascending: false
            }
        )
        .limit(1);

    if (error) {
        throw error;
    }

    if (
        !data ||
        data.length === 0
    ) {

        return 0;

    }

    return (
        Number(
            data[0].sort_order
        ) + 1
    );

}


// ======================================================
// SET MAIN IMAGE
// ======================================================

async function setMainImage(
    image,
    reloadAfter = true
) {

    if (
        !image ||
        !image.id ||
        !image.hotel_id
    ) {

        return;
    }

    try {

        // Remove main flag from the hotel's other images.
        const {
            error: clearError
        } = await window.db
            .from(
                "hotel_images"
            )
            .update({
                is_main: false
            })
            .eq(
                "hotel_id",
                image.hotel_id
            );

        if (clearError) {
            throw clearError;
        }


        // Set this image as main.
        const {
            error: mainError
        } = await window.db
            .from(
                "hotel_images"
            )
            .update({
                is_main: true
            })
            .eq(
                "id",
                image.id
            );

        if (mainError) {
            throw mainError;
        }


        // Keep hotels.main_image in sync so the
        // existing public results page can use it.
        const {
            error: hotelError
        } = await window.db
            .from(
                "hotels"
            )
            .update({
                main_image:
                    image.image_url
            })
            .eq(
                "id",
                image.hotel_id
            );

        if (hotelError) {
            throw hotelError;
        }


        if (reloadAfter) {

            showMessage(
                "Main hotel image updated.",
                false
            );

            await loadHotelImages();

        }

    } catch (error) {

        console.error(
            "Main image update failed:",
            error
        );

        throw error;

    }

}


// ======================================================
// DELETE IMAGE
// ======================================================

async function deleteHotelImage(
    image
) {

    const confirmed =
        window.confirm(
            "Delete this hotel image?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const wasMain =
            image.is_main === true;


        // ==================================================
        // DELETE DATABASE RECORD
        // ==================================================

        const {
            error: deleteError
        } = await window.db
            .from(
                "hotel_images"
            )
            .delete()
            .eq(
                "id",
                image.id
            );

        if (deleteError) {
            throw deleteError;
        }


        // ==================================================
        // DELETE STORAGE FILE
        // ==================================================

        if (image.storage_path) {

            const {
                error: storageError
            } = await window.db
                .storage
                .from(
                    "hotel-images"
                )
                .remove(
                    [
                        image.storage_path
                    ]
                );

            if (storageError) {

                console.error(
                    "Storage file deletion failed:",
                    storageError
                );

            }

        }


        // ==================================================
        // IF MAIN IMAGE WAS DELETED
        // PICK ANOTHER IMAGE
        // ==================================================

        if (wasMain) {

            await assignReplacementMainImage(
                image.hotel_id
            );

        }


        showMessage(
            "Image deleted successfully.",
            false
        );

        await loadHotelImages();

    } catch (error) {

        console.error(
            "Image deletion failed:",
            error
        );

        showMessage(
            error?.message ||
            "Unable to delete the image.",
            true
        );

    }

}


// ======================================================
// REPLACE DELETED MAIN IMAGE
// ======================================================

async function assignReplacementMainImage(
    hotelId
) {

    const {
        data,
        error
    } = await window.db
        .from(
            "hotel_images"
        )
        .select(
            `
                id,
                hotel_id,
                image_url,
                sort_order
            `
        )
        .eq(
            "hotel_id",
            hotelId
        )
        .order(
            "sort_order",
            {
                ascending: true
            }
        )
        .limit(1);

    if (error) {
        throw error;
    }


    // If another image exists, make it the main image.
    if (
        data &&
        data.length > 0
    ) {

        await setMainImage(
            data[0],
            false
        );

        return;
    }


    // No images remain, clear hotels.main_image.
    const {
        error: hotelError
    } = await window.db
        .from(
            "hotels"
        )
        .update({
            main_image: null
        })
        .eq(
            "id",
            hotelId
        );

    if (hotelError) {
        throw hotelError;
    }

}


// ======================================================
// REMOVE STORAGE FILE
// Used if database insert fails after upload.
// ======================================================

async function removeStorageFile(
    storagePath
) {

    if (!storagePath) {
        return;
    }

    try {

        await window.db
            .storage
            .from(
                "hotel-images"
            )
            .remove(
                [
                    storagePath
                ]
            );

    } catch (error) {

        console.error(
            "Storage cleanup failed:",
            error
        );

    }

}


// ======================================================
// UNIQUE FILE ID
// ======================================================

function createUniqueId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto.randomUUID();

    }

    return (
        Date.now().toString() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 12)
    );

}


// ======================================================
// EMPTY IMAGE LIBRARY
// ======================================================

function showEmptyLibrary(
    message
) {

    const container =
        document.getElementById(
            "hotelImages"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const empty =
        document.createElement(
            "div"
        );

    empty.className =
        "empty-images";

    empty.textContent =
        message;

    container.appendChild(
        empty
    );

}


// ======================================================
// STATUS MESSAGE
// ======================================================

function showMessage(
    text,
    isError
) {

    const message =
        document.getElementById(
            "imageMessage"
        );

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.classList.remove(
        "success",
        "error"
    );

    if (!text) {

        message.style.display =
            "none";

        return;
    }

    message.style.display =
        "block";

    message.classList.add(
        isError
            ? "error"
            : "success"
    );

}