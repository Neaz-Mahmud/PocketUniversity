// Prebuilt Bangladesh geography (8 divisions → 64 districts/zilas) used to
// constrain book-listing location fields, so sellers can only pick from a known
// set and buyers can filter reliably. Exposed publicly via GET /meta/geo.
const DIVISIONS = {
  Barishal: ['Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
  Chattogram: [
    'Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', "Cox's Bazar", 'Cumilla',
    'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati',
  ],
  Dhaka: [
    'Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj',
    'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail',
  ],
  Khulna: [
    'Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura',
    'Meherpur', 'Narail', 'Satkhira',
  ],
  Mymensingh: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
  Rajshahi: [
    'Bogura', 'Chapainawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Rajshahi', 'Sirajganj',
  ],
  Rangpur: [
    'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon',
  ],
  Sylhet: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
};

const isValidLocation = (division, zila) =>
  !!DIVISIONS[division] && DIVISIONS[division].includes(zila);

module.exports = { DIVISIONS, isValidLocation };
