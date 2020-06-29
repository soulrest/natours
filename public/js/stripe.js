import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51GxaamGqFE1mu3HAjQTMBGSvNBH3GDDv0Bl7siwAiVNPcIScaicGtcmG7N1RiuJLRoUqECzJ7kPgd8ZixoIgaPw400OevlzcVK');

export const bookTour = async tourId => {
    try {
        // 1) Get checkout session from API
        const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
        // console.log(session);
        // 2) Create checkout form + charge credit card
        stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (err) {
        showAlert('error', err);
    };
}