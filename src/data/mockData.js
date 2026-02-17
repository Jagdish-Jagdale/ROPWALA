

export const CATEGORIES = [
    { id: 'all', name: 'All', image: 'https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'indoor', name: 'Indoor', image: 'https://images.pexels.com/photos/796602/pexels-photo-796602.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'outdoor', name: 'Outdoor', image: 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'flowering', name: 'Flowering', image: 'https://images.pexels.com/photos/1408221/pexels-photo-1408221.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'succulents', name: 'Succulents', image: 'https://images.pexels.com/photos/1903965/pexels-photo-1903965.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'herbs', name: 'Herbs', image: 'https://images.pexels.com/photos/2583852/pexels-photo-2583852.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'fruit', name: 'Fruit', image: 'https://images.pexels.com/photos/2363345/pexels-photo-2363345.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'medicinal', name: 'Medicinal', image: 'https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'ornamental', name: 'Ornamental', image: 'https://images.pexels.com/photos/207518/pexels-photo-207518.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'climbers', name: 'Climbers', image: 'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'trees', name: 'Trees', image: 'https://images.pexels.com/photos/1179863/pexels-photo-1179863.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'shrubs', name: 'Shrubs', image: 'https://images.pexels.com/photos/1268558/pexels-photo-1268558.jpeg?auto=compress&cs=tinysrgb&w=150' },
    { id: 'cacti', name: 'Cacti', image: 'https://images.pexels.com/photos/1484759/pexels-photo-1484759.jpeg?auto=compress&cs=tinysrgb&w=150' },
]

export const PRODUCTS = [
    {
        id: 1,
        name: "Rose Plant",
        price: 199,
        inStock: true,
        image: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: 4.5,
        reviews: 128,
        delivery: "2 days",
        category: "Flowering"
    },
    {
        id: 2,
        name: "Corsa Sant",
        price: 30,
        inStock: false,
        image: "https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=400",
        new: true,
        rating: 4.2,
        reviews: 86,
        delivery: "1 day",
        category: "Indoor"
    },
    {
        id: 3,
        name: "Snake Plant",
        price: 22,
        inStock: true,
        image: "https://images.pexels.com/photos/2123482/pexels-photo-2123482.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: 4.8,
        reviews: 256,
        delivery: "3 days",
        category: "Indoor"
    },
    {
        id: 4,
        name: "Bonsai Tree",
        price: 80,
        inStock: true,
        image: "https://images.pexels.com/photos/4503273/pexels-photo-4503273.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: 4.6,
        reviews: 192,
        delivery: "5 days",
        category: "Indoor"
    },
    {
        id: 5,
        name: "Jade Plant",
        price: 27,
        inStock: true,
        image: "https://images.pexels.com/photos/1382394/pexels-photo-1382394.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: 4.4,
        reviews: 67,
        delivery: "2 days",
        category: "Succulents"
    },
    {
        id: 6,
        name: "Money Plant",
        price: 149,
        inStock: true,
        image: "https://images.pexels.com/photos/3049121/pexels-photo-3049121.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: 4.7,
        reviews: 312,
        delivery: "1 day",
        category: "Indoor"
    },
    {
        id: 7,
        name: "Aloe Vera",
        price: 89,
        inStock: true,
        image: "https://images.pexels.com/photos/1903965/pexels-photo-1903965.jpeg?auto=compress&cs=tinysrgb&w=400",
        new: true,
        rating: 4.9,
        reviews: 445,
        delivery: "4 days",
        category: "Medicinal"
    },
    {
        id: 8,
        name: "Peace Lily",
        price: 299,
        inStock: false,
        image: "https://images.pexels.com/photos/3076899/pexels-photo-3076899.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: 4.3,
        reviews: 178,
        delivery: "5 days",
        category: "Flowering"
    },
    {
        id: 9,
        name: "Monstera",
        price: 450,
        inStock: true,
        image: "https://images.pexels.com/photos/3125195/pexels-photo-3125195.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: 4.8,
        reviews: 523,
        delivery: "6 days",
        category: "Indoor"
    },
    {
        id: 10,
        name: "Fern Plant",
        price: 75,
        inStock: true,
        image: "https://images.pexels.com/photos/1445418/pexels-photo-1445418.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: 4.1,
        reviews: 89,
        delivery: "2 days",
        category: "Indoor"
    },
    {
        id: 11,
        name: "Cactus Mix",
        price: 199,
        inStock: true,
        image: "https://images.pexels.com/photos/1903969/pexels-photo-1903969.jpeg?auto=compress&cs=tinysrgb&w=400",
        rating: 4.6,
        reviews: 234,
        delivery: "5 days",
        category: "Cacti"
    },
    {
        id: 12,
        name: "Bamboo Palm",
        price: 350,
        inStock: true,
        image: "https://images.pexels.com/photos/2132227/pexels-photo-2132227.jpeg?auto=compress&cs=tinysrgb&w=400",
        new: true,
        rating: 4.5,
        reviews: 156,
        delivery: "1 day",
        category: "Indoor"
    },
]
