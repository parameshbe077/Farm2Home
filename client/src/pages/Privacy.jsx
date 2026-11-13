import { Link } from 'react-router-dom';
import PageBanner from '../components/PageBanner';

export default function Privacy() {
  return (
    <div className="page">
      <PageBanner
        label="Policies"
        title="Privacy and cancellation"
        subtitle="What we keep, and when you can cancel"
      />
      <div className="container policy">
        <section>
          <h2>What we collect</h2>
          <p>
            To deliver an order we ask for your name, phone number, delivery address, area, pincode, and an optional delivery note.
            If you drop a pin on the map, we also store that location so the order reaches the right door.
          </p>
          <p>
            Signing in with email or Google gives us the email address on that account, and the name Google shares if you use Google sign-in.
            We use that account to show My Orders and to attach each order to you.
          </p>
        </section>
        <section>
          <h2>How we use it</h2>
          <p>
            We use these details to deliver the order, to let you track it with your order number and phone, and to email the farm when an order is placed.
            We do not sell this information. Payment is cash on delivery, so we do not collect card or UPI details.
          </p>
        </section>
        <section>
          <h2>Cancellation</h2>
          <p>
            While an order is still pending, you can cancel it from <Link to="/my-orders">My Orders</Link>.
            The items go back into stock, and you pay nothing because the order was cash on delivery.
          </p>
          <p>
            After the farm confirms the order, cancel from the website is closed because the produce may already be packed.
            Call <a href="tel:+919963785421">+91 9963785421</a> or email <a href="mailto:farm2homesouth@gmail.com">farm2homesouth@gmail.com</a> and we will help if we still can.
          </p>
          <p>
            Delivered produce is perishable, so we do not take it back after delivery unless something arrived damaged. Tell us the same day.
          </p>
        </section>
      </div>
    </div>
  );
}
