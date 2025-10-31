import mongoose from 'mongoose';
import Room from'../models/Room.js';

const rooms = [
  {
    name: 'Study Stress Support',
    description: 'Share your academic pressures and find solidarity',
    category: 'Academic',
    icon: '📚',
    color: 'from-blue-500/20 to-blue-600/20',
    borderColor: 'border-blue-500/30',
    mood: 'supportive'
  },
  // ... other rooms
];

async function seedRooms() {
  try {
    await mongoose.connect('mongodb+srv://jassymande:xHTJCw7y5KRKCJuZ@nuzihi.qd9fjiv.mongodb.net/?retryWrites=true&w=majority&appName=Nuzihi');
    await Room.deleteMany({});
    await Room.insertMany(rooms);
    console.log('Rooms seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedRooms();