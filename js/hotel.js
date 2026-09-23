// ======================================================
// PackageHolidayCompare
// Public Hotel Details Page
// Version: 2026-09-23-1
// ======================================================

let currentHotel = null;
let currentOffers = [];
let currentImages = [];
let supplierMap = {};


// ======================================================
// START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    initialiseHotelPage
);


async function initialiseHotelPage() {

    if (!window.db) {

        showError(
            "The holiday database is currently unavailable."
        );

        return;
    }

    const hotelReference =
        getHotelReference();

    if (!hotelReference) {

        showError(
            "No hotel was selected."
        );

        return;
    }

    try {

        await loadHotel(
            hotelReference
        );

        await Promise.all([
            loadHotelImages(),
            loadSuppliers(),
            loadHotelOffers()
        ]);

        renderHotel();

        hideLoading();

    } catch (error) {

        console.error(
            "Hotel page loading failed:",
            error
        );

        showError(
            error?.message ||
            "Unable to load this hotel."
        );

    }

}


// ======================================================
// GET HOTEL ID OR SLUG FROM URL
//
// Supported examples:
// hotel.html?id=HOTEL_UUID
// hotel.html?slug=neverland-hurghada-resort
// ======================================================

function getHotelReference() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id");

    const slug =
        params.get("slug");

    if (id) {

        return {
            type: "id",
            value: id
        };

    }

    if (slug) {

        return {
            type: "slug",
            value: slug
        };

    }

    return null;

}


// ======================================================
// LOAD HOTEL
// ======================================================

async function loadHotel(
    reference
) {

    let query =
        window.db
            .from("hotels")
            .select("*");

    if (
        reference.type ===
        "id"
    ) {

        query =
            query.eq(
                "id",
                reference.value
            );

    } else {

        query =
            query.eq(
                "slug",
                reference.value
            );

    }

    const {
        data,
        error
    } = await query.single();

    if (error) {
        throw error;
    }

    if (!data) {

        throw new Error(
            "This hotel could not be found."
        );

    }

    currentHotel =
        data;

}


// ======================================================
// LOAD HOTEL IMAGES
// ======================================================

async function loadHotelImages() {

    currentImages = [];

    if (!currentHotel?.id) {
        return;
    }

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
                    alt_text,
                    is_main,
                    sort_order,
                    created_at
                `
            )
            .eq(
                "hotel_id",
                currentHotel.id
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
            Array.isArray(data)
                ? data
                : [];

    } catch (error) {

        console.error(
            "Hotel images could not be loaded:",
            error
        );

        currentImages = [];

    }

}


// ======================================================
// LOAD SUPPLIER DETAILS
// ======================================================

async function loadSuppliers() {

    supplierMap = {};

    try {

        const {
            data,
            error
        } = await window.db
            .from("suppliers")
            .select(
                `
                    name,
                    slug,
                    logo_url,
                    website_url,
                    active
                `
            );

        if (error) {
            throw error;
        }

        (
            data || []
        ).forEach(
            supplier => {

                const key =
                    normaliseText(
                        supplier.name
                    );

                if (key) {

                    supplierMap[key] =
                        supplier;

                }

            }
        );

    } catch (error) {

        console.error(
            "Suppliers could not be loaded:",
            error
        );

        supplierMap = {};

    }

}


// ======================================================
// LOAD HOTEL OFFERS
// ======================================================

async function loadHotelOffers() {

    if (!currentHotel?.id) {
        return;
    }

    const {
        data,
        error
    } = await window.db
        .from("holiday_offers")
        .select("*")
        .eq(
            "hotel_id",
            currentHotel.id
        );

    if (error) {
        throw error;
    }

    currentOffers =
        Array.isArray(data)
            ? data
            : [];

    currentOffers.sort(
        (
            first,
            second
        ) => {

            return (
                getOfferPrice(first) -
                getOfferPrice(second)
            );

        }
    );

}


// ======================================================
// RENDER COMPLETE HOTEL PAGE
// ======================================================

function renderHotel() {

    renderHotelHeading();

    renderGallery();

    renderHotelDescription();

    renderHotelFacts();

    renderCheapestOffer();

    renderOffersTable();

    updateDocumentTitle();

}


// ======================================================
// HOTEL HEADING
// ======================================================

function renderHotelHeading() {

    setText(
        "hotelName",
        currentHotel?.name ||
        "Hotel"
    );


    const locationParts =
        [
            currentHotel?.destination,
            currentHotel?.country
        ]
        .filter(Boolean);

    setText(
        "hotelLocation",
        locationParts.join(", ")
    );


    const stars =
        Number(
            currentHotel?.stars
        ) || 0;

    const starText =
        stars > 0
            ? "★".repeat(
                Math.min(
                    stars,
                    5
                )
            )
            : "";

    setText(
        "hotelStars",
        starText
    );

}


// ======================================================
// IMAGE GALLERY
// ======================================================

function renderGallery() {

    const mainImage =
        document.getElementById(
            "mainHotelImage"
        );

    const thumbnails =
        document.getElementById(
            "galleryThumbnails"
        );

    if (
        !mainImage ||
        !thumbnails
    ) {

        return;

    }

    thumbnails.innerHTML = "";


    // Create a clean list of available images.
    const galleryImages =
        currentImages
            .filter(
                image =>
                    isValidHttpUrl(
                        image.image_url
                    )
            );


    // If hotel_images has no records,
    // fall back to hotels.main_image.
    if (
        galleryImages.length === 0 &&
        isValidHttpUrl(
            currentHotel?.main_image
        )
    ) {

        galleryImages.push({
            id: "main-image-fallback",
            image_url:
                currentHotel.main_image,

            alt_text:
                currentHotel.name,

            is_main:
                true
        });

    }


    if (
        galleryImages.length === 0
    ) {

        mainImage.removeAttribute(
            "src"
        );

        mainImage.alt =
            "No hotel image available";

        mainImage.style.display =
            "none";

        thumbnails.style.display =
            "none";

        return;

    }


    mainImage.style.display =
        "block";

    thumbnails.style.display =
        "flex";


    const firstImage =
        galleryImages.find(
            image =>
                image.is_main === true
        ) ||
        galleryImages[0];


    setMainGalleryImage(
        firstImage
    );


    galleryImages.forEach(
        (
            image,
            index
        ) => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "gallery-thumbnail";


            if (
                image.id ===
                firstImage.id
            ) {

                button.classList.add(
                    "active"
                );

            }


            const thumbnailImage =
                document.createElement(
                    "img"
                );

            thumbnailImage.src =
                image.image_url;

            thumbnailImage.alt =
                image.alt_text ||
                currentHotel.name ||
                "Hotel image";

            thumbnailImage.loading =
                index < 3
                    ? "eager"
                    : "lazy";


            button.appendChild(
                thumbnailImage
            );


            button.addEventListener(
                "click",
                () => {

                    setMainGalleryImage(
                        image
                    );

                    document
                        .querySelectorAll(
                            ".gallery-thumbnail"
                        )
                        .forEach(
                            thumbnail => {

                                thumbnail
                                    .classList
                                    .remove(
                                        "active"
                                    );

                            }
                        );

                    button.classList.add(
                        "active"
                    );

                }
            );


            thumbnails.appendChild(
                button
            );

        }
    );

}


// ======================================================
// CHANGE LARGE GALLERY IMAGE
// ======================================================

function setMainGalleryImage(
    image
) {

    const mainImage =
        document.getElementById(
            "mainHotelImage"
        );

    if (!mainImage) {
        return;
    }

    mainImage.src =
        image.image_url;

    mainImage.alt =
        image.alt_text ||
        currentHotel?.name ||
        "Hotel image";

}


// ======================================================
// HOTEL DESCRIPTION
// ======================================================

function renderHotelDescription() {

    const description =
        currentHotel?.description
            ?.trim();

    setText(
        "hotelDescription",
        description ||
        "More information about this hotel will be added soon."
    );

}


// ======================================================
// HOTEL FACTS
// ======================================================

function renderHotelFacts() {

    setText(
        "hotelDestination",
        currentHotel?.destination ||
        "-"
    );

    setText(
        "hotelCountry",
        currentHotel?.country ||
        "-"
    );

    setText(
        "hotelBoard",
        currentHotel?.board_basis ||
        "-"
    );


    const rating =
        Number(
            currentHotel?.rating
        );

    setText(
        "hotelRating",
        Number.isFinite(rating) &&
        rating > 0
            ? `${rating.toFixed(1)} / 5`
            : "-"
    );


    setText(
        "hotelAirport",
        currentHotel?.airport ||
        "-"
    );

    setText(
        "hotelTransfer",
        currentHotel?.transfer_time ||
        "-"
    );

}


// ======================================================
// CHEAPEST OFFER
// ======================================================

function renderCheapestOffer() {

    const container =
        document.getElementById(
            "cheapestOfferContent"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";


    if (
        currentOffers.length === 0
    ) {

        const message =
            document.createElement(
                "p"
            );

        message.textContent =
            "There are currently no holiday offers available for this hotel.";

        container.appendChild(
            message
        );

        return;

    }


    const offer =
        currentOffers[0];

    const supplierName =
        getOfferSupplierName(
            offer
        );

    const supplier =
        getSupplierRecord(
            supplierName
        );


    if (
        supplier &&
        isValidHttpUrl(
            supplier.logo_url
        )
    ) {

        const logo =
            document.createElement(
                "img"
            );

        logo.src =
            supplier.logo_url;

        logo.alt =
            `${supplierName} logo`;

        logo.className =
            "supplier-logo";

        container.appendChild(
            logo
        );

    }


    const label =
        document.createElement(
            "div"
        );

    label.className =
        "cheapest-label";

    label.textContent =
        "Current lowest listed price";

    container.appendChild(
        label
    );


    const supplierElement =
        document.createElement(
            "div"
        );

    supplierElement.className =
        "cheapest-supplier";

    supplierElement.textContent =
        supplierName;

    container.appendChild(
        supplierElement
    );


    const price =
        document.createElement(
            "div"
        );

    price.className =
        "cheapest-price";

    price.textContent =
        formatPrice(
            getOfferPrice(
                offer
            )
        );

    container.appendChild(
        price
    );


    const details =
        document.createElement(
            "div"
        );

    details.className =
        "cheapest-details";

    const detailParts = [];


    const departure =
        getOfferDeparture(
            offer
        );

    if (departure) {

        detailParts.push(
            `Departure: ${
                formatDate(
                    departure
                )
            }`
        );

    }


    if (offer.airport) {

        detailParts.push(
            `Airport: ${offer.airport}`
        );

    }


    if (offer.nights) {

        detailParts.push(
            `${
                offer.nights
            } nights`
        );

    }


    const board =
        getOfferBoard(
            offer
        );

    if (board) {

        detailParts.push(
            board
        );

    }


    const roomType =
        getOfferRoomType(
            offer
        );

    if (roomType) {

        detailParts.push(
            roomType
        );

    }


    details.textContent =
        detailParts.join(" • ");

    container.appendChild(
        details
    );


    const bookingUrl =
        getOfferBookingUrl(
            offer
        );


    if (
        isValidHttpUrl(
            bookingUrl
        )
    ) {

        const dealButton =
            document.createElement(
                "a"
            );

        dealButton.href =
            bookingUrl;

        dealButton.target =
            "_blank";

        dealButton.rel =
            "noopener noreferrer";

        dealButton.className =
            "deal-button";

        dealButton.textContent =
            "View Deal";

        container.appendChild(
            dealButton
        );

    } else {

        const disabledButton =
            document.createElement(
                "span"
            );

        disabledButton.className =
            "deal-button disabled";

        disabledButton.textContent =
            "No booking link";

        container.appendChild(
            disabledButton
        );

    }

}


// ======================================================
// ALL OFFERS TABLE
// ======================================================

function renderOffersTable() {

    const table =
        document.getElementById(
            "offersTable"
        );

    if (!table) {
        return;
    }

    table.innerHTML = "";


    if (
        currentOffers.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );

        const cell =
            document.createElement(
                "td"
            );

        cell.colSpan =
            8;

        cell.className =
            "empty-offers";

        cell.textContent =
            "No holiday offers are currently available.";

        row.appendChild(
            cell
        );

        table.appendChild(
            row
        );

        return;

    }


    currentOffers.forEach(
        offer => {

            const row =
                document.createElement(
                    "tr"
                );


            // ==========================================
            // SUPPLIER
            // ==========================================

            const supplierCell =
                document.createElement(
                    "td"
                );

            supplierCell.className =
                "supplier-cell";


            const supplierName =
                getOfferSupplierName(
                    offer
                );

            const supplier =
                getSupplierRecord(
                    supplierName
                );


            if (
                supplier &&
                isValidHttpUrl(
                    supplier.logo_url
                )
            ) {

                const logo =
                    document.createElement(
                        "img"
                    );

                logo.src =
                    supplier.logo_url;

                logo.alt =
                    `${supplierName} logo`;

                logo.className =
                    "supplier-logo";

                supplierCell.appendChild(
                    logo
                );

            }


            const supplierText =
                document.createElement(
                    "strong"
                );

            supplierText.textContent =
                supplierName;

            supplierCell.appendChild(
                supplierText
            );

            row.appendChild(
                supplierCell
            );


            // ==========================================
            // PRICE
            // ==========================================

            const priceCell =
                document.createElement(
                    "td"
                );

            priceCell.className =
                "offer-price";

            priceCell.textContent =
                formatPrice(
                    getOfferPrice(
                        offer
                    )
                );

            row.appendChild(
                priceCell
            );


            // ==========================================
            // DEPARTURE
            // ==========================================

            appendTextCell(
                row,
                formatDate(
                    getOfferDeparture(
                        offer
                    )
                )
            );


            // ==========================================
            // AIRPORT
            // ==========================================

            appendTextCell(
                row,
                offer.airport ||
                "-"
            );


            // ==========================================
            // NIGHTS
            // ==========================================

            appendTextCell(
                row,
                offer.nights
                    ? String(
                        offer.nights
                    )
                    : "-"
            );


            // ==========================================
            // BOARD
            // ==========================================

            appendTextCell(
                row,
                getOfferBoard(
                    offer
                ) ||
                "-"
            );


            // ==========================================
            // ROOM TYPE
            // ==========================================

            appendTextCell(
                row,
                getOfferRoomType(
                    offer
                ) ||
                "-"
            );


            // ==========================================
            // BOOKING BUTTON
            // ==========================================

            const dealCell =
                document.createElement(
                    "td"
                );

            const bookingUrl =
                getOfferBookingUrl(
                    offer
                );


            if (
                isValidHttpUrl(
                    bookingUrl
                )
            ) {

                const dealButton =
                    document.createElement(
                        "a"
                    );

                dealButton.href =
                    bookingUrl;

                dealButton.target =
                    "_blank";

                dealButton.rel =
                    "noopener noreferrer";

                dealButton.className =
                    "small-deal-button";

                dealButton.textContent =
                    "View Deal";

                dealCell.appendChild(
                    dealButton
                );

            } else {

                const noLink =
                    document.createElement(
                        "span"
                    );

                noLink.className =
                    "no-link";

                noLink.textContent =
                    "No link";

                dealCell.appendChild(
                    noLink
                );

            }


            row.appendChild(
                dealCell
            );


            table.appendChild(
                row
            );

        }
    );

}


// ======================================================
// OFFER FIELD HELPERS
//
// These support the names used during earlier database
// versions as well as the current fields.
// ======================================================

function getOfferPrice(
    offer
) {

    const price =
        Number(
            offer?.price
        );

    return Number.isFinite(
        price
    )
        ? price
        : 0;

}


function getOfferSupplierName(
    offer
) {

    return (
        offer?.supplier ||
        "Supplier"
    );

}


function getOfferDeparture(
    offer
) {

    return (
        offer?.departure_date ||
        offer?.depart_date ||
        ""
    );

}


function getOfferBoard(
    offer
) {

    return (
        offer?.board_basis ||
        offer?.board ||
        ""
    );

}


function getOfferRoomType(
    offer
) {

    return (
        offer?.room_type ||
        offer?.room ||
        ""
    );

}


function getOfferBookingUrl(
    offer
) {

    return (
        offer?.booking_url ||
        offer?.booking_link ||
        ""
    );

}


// ======================================================
// SUPPLIER LOOKUP
// ======================================================

function getSupplierRecord(
    supplierName
) {

    const key =
        normaliseText(
            supplierName
        );

    return (
        supplierMap[key] ||
        null
    );

}


// ======================================================
// PAGE TITLE
// ======================================================

function updateDocumentTitle() {

    if (!currentHotel?.name) {
        return;
    }

    document.title =
        `${currentHotel.name} | PackageHolidayCompare`;

}


// ======================================================
// FORMAT PRICE
// ======================================================

function formatPrice(
    price
) {

    const value =
        Number(price);

    if (
        !Number.isFinite(
            value
        )
    ) {

        return "-";

    }

    return new Intl.NumberFormat(
        "en-GB",
        {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits:
                value % 1 === 0
                    ? 0
                    : 2
        }
    ).format(
        value
    );

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
    dateValue
) {

    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(
            `${dateValue}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

    }

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    ).format(
        date
    );

}


// ======================================================
// VALID URL
// ======================================================

function isValidHttpUrl(
    value
) {

    if (
        typeof value !==
        "string"
    ) {

        return false;

    }

    const trimmed =
        value.trim();

    if (!trimmed) {
        return false;
    }

    try {

        const url =
            new URL(
                trimmed
            );

        return (
            url.protocol ===
                "http:" ||
            url.protocol ===
                "https:"
        );

    } catch (error) {

        return false;

    }

}


// ======================================================
// NORMALISE TEXT
// ======================================================

function normaliseText(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


// ======================================================
// ADD BASIC TABLE CELL
// ======================================================

function appendTextCell(
    row,
    value
) {

    const cell =
        document.createElement(
            "td"
        );

    cell.textContent =
        value;

    row.appendChild(
        cell
    );

}


// ======================================================
// SET TEXT SAFELY
// ======================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (!element) {
        return;
    }

    element.textContent =
        value;

}


// ======================================================
// LOADING
// ======================================================

function hideLoading() {

    const loading =
        document.getElementById(
            "loadingCard"
        );

    const content =
        document.getElementById(
            "hotelContent"
        );

    const error =
        document.getElementById(
            "errorCard"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (error) {

        error.style.display =
            "none";

    }


    if (content) {

        content.style.display =
            "block";

    }

}


// ======================================================
// ERROR
// ======================================================

function showError(
    message
) {

    const loading =
        document.getElementById(
            "loadingCard"
        );

    const content =
        document.getElementById(
            "hotelContent"
        );

    const errorCard =
        document.getElementById(
            "errorCard"
        );

    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (content) {

        content.style.display =
            "none";

    }


    if (errorCard) {

        errorCard.style.display =
            "block";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }

}