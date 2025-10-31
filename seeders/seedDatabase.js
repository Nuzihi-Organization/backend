// seeders/seedDatabase.js (ES Modules)
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Therapist from '../models/Therapist.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

dotenv.config();

const therapists = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@afyanafsi.com',
    password: 'password123',
    specialties: ['Anxiety', 'Depression', 'Trauma'],
    bio: 'Licensed clinical psychologist with over 10 years of experience helping individuals overcome anxiety, depression, and trauma. I use evidence-based approaches including CBT and mindfulness techniques.',
    qualifications: [
      'PhD in Clinical Psychology - University of Nairobi',
      'Licensed Clinical Psychologist',
      'Certified CBT Therapist'
    ],
    experience: 10,
    location: 'Nairobi, Kenya',
    modes: ['Video', 'In-Person', 'Phone'],
    sessionRate: 5000,
    isApproved: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 45,
    availability: [
      {
        day: 'Monday',
        slots: [
          { startTime: '09:00', endTime: '10:00', isBooked: false },
          { startTime: '10:00', endTime: '11:00', isBooked: false },
          { startTime: '14:00', endTime: '15:00', isBooked: false },
          { startTime: '15:00', endTime: '16:00', isBooked: false }
        ]
      },
      {
        day: 'Wednesday',
        slots: [
          { startTime: '09:00', endTime: '10:00', isBooked: false },
          { startTime: '10:00', endTime: '11:00', isBooked: false },
          { startTime: '14:00', endTime: '15:00', isBooked: false }
        ]
      },
      {
        day: 'Friday',
        slots: [
          { startTime: '09:00', endTime: '10:00', isBooked: false },
          { startTime: '11:00', endTime: '12:00', isBooked: false },
          { startTime: '14:00', endTime: '15:00', isBooked: false }
        ]
      }
    ]
  },
  {
    name: 'Dr. Michael Ochieng',
    email: 'michael.ochieng@afyanafsi.com',
    password: 'password123',
    specialties: ['Stress', 'Career', 'Relationships'],
    bio: 'Experienced counselor specializing in stress management, career counseling, and relationship therapy. I help clients find balance and fulfillment in their personal and professional lives.',
    qualifications: [
      'Masters in Counseling Psychology',
      'Licensed Professional Counselor',
      'Career Development Specialist'
    ],
    experience: 8,
    location: 'Mombasa, Kenya',
    modes: ['Video', 'Phone', 'Chat'],
    sessionRate: 4000,
    isApproved: true,
    isActive: true,
    rating: 4.6,
    reviewCount: 32,
    availability: [
      {
        day: 'Tuesday',
        slots: [
          { startTime: '10:00', endTime: '11:00', isBooked: false },
          { startTime: '11:00', endTime: '12:00', isBooked: false },
          { startTime: '15:00', endTime: '16:00', isBooked: false }
        ]
      },
      {
        day: 'Thursday',
        slots: [
          { startTime: '09:00', endTime: '10:00', isBooked: false },
          { startTime: '10:00', endTime: '11:00', isBooked: false },
          { startTime: '14:00', endTime: '15:00', isBooked: false }
        ]
      }
    ]
  },
  {
    name: 'Dr. Grace Wanjiku',
    email: 'grace.wanjiku@afyanafsi.com',
    password: 'password123',
    specialties: ['Family', 'Grief', 'Addiction'],
    bio: 'Compassionate therapist with expertise in family therapy, grief counseling, and addiction recovery. I create a safe space for healing and growth.',
    qualifications: [
      'PhD in Family Therapy',
      'Licensed Marriage and Family Therapist',
      'Certified Addiction Counselor'
    ],
    experience: 12,
    location: 'Kisumu, Kenya',
    modes: ['Video', 'In-Person'],
    sessionRate: 6000,
    isApproved: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 67,
    availability: [
      {
        day: 'Monday',
        slots: [
          { startTime: '08:00', endTime: '09:00', isBooked: false },
          { startTime: '09:00', endTime: '10:00', isBooked: false },
          { startTime: '13:00', endTime: '14:00', isBooked: false }
        ]
      },
      {
        day: 'Wednesday',
        slots: [
          { startTime: '08:00', endTime: '09:00', isBooked: false },
          { startTime: '13:00', endTime: '14:00', isBooked: false },
          { startTime: '14:00', endTime: '15:00', isBooked: false }
        ]
      },
      {
        day: 'Friday',
        slots: [
          { startTime: '08:00', endTime: '09:00', isBooked: false },
          { startTime: '09:00', endTime: '10:00', isBooked: false }
        ]
      }
    ]
  },
  {
    name: 'Dr. James Kimani',
    email: 'james.kimani@afyanafsi.com',
    password: 'password123',
    specialties: ['Depression', 'Anxiety', 'Stress'],
    bio: 'Dedicated mental health professional with a focus on helping individuals manage depression, anxiety, and stress through therapeutic interventions and lifestyle modifications.',
    qualifications: [
      'MD Psychiatry',
      'Board Certified Psychiatrist',
      'Cognitive Behavioral Therapy Specialist'
    ],
    experience: 15,
    location: 'Nairobi, Kenya',
    modes: ['Video', 'In-Person', 'Phone'],
    sessionRate: 7000,
    isApproved: true,
    isActive: true,
    rating: 4.7,
    reviewCount: 89,
    availability: [
      {
        day: 'Tuesday',
        slots: [
          { startTime: '09:00', endTime: '10:00', isBooked: false },
          { startTime: '10:00', endTime: '11:00', isBooked: false },
          { startTime: '11:00', endTime: '12:00', isBooked: false }
        ]
      },
      {
        day: 'Thursday',
        slots: [
          { startTime: '09:00', endTime: '10:00', isBooked: false },
          { startTime: '10:00', endTime: '11:00', isBooked: false },
          { startTime: '15:00', endTime: '16:00', isBooked: false }
        ]
      },
      {
        day: 'Saturday',
        slots: [
          { startTime: '10:00', endTime: '11:00', isBooked: false },
          { startTime: '11:00', endTime: '12:00', isBooked: false }
        ]
      }
    ]
  },
  {
    name: 'Dr. Esther Muthoni',
    email: 'esther.muthoni@afyanafsi.com',
    password: 'password123',
    specialties: ['Trauma', 'Anxiety'],
    bio: 'Specialized in trauma-informed therapy and PTSD treatment. I help survivors reclaim their lives and build resilience through compassionate, evidence-based care.',
    qualifications: [
      'Masters in Clinical Psychology',
      'Trauma-Focused CBT Certified',
      'EMDR Therapist'
    ],
    experience: 9,
    location: 'Nakuru, Kenya',
    modes: ['Video', 'In-Person'],
    sessionRate: 5500,
    isApproved: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 41,
    availability: [
      {
        day: 'Monday',
        slots: [
          { startTime: '10:00', endTime: '11:00', isBooked: false },
          { startTime: '14:00', endTime: '15:00', isBooked: false }
        ]
      },
      {
        day: 'Wednesday',
        slots: [
          { startTime: '10:00', endTime: '11:00', isBooked: false },
          { startTime: '11:00', endTime: '12:00', isBooked: false }
        ]
      },
      {
        day: 'Friday',
        slots: [
          { startTime: '09:00', endTime: '10:00', isBooked: false },
          { startTime: '14:00', endTime: '15:00', isBooked: false }
        ]
      }
    ]
  }
];

const users = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'user',
    preferences: {
      therapyTypes: ['Anxiety', 'Stress'],
      preferredModes: ['Video'],
      location: 'Nairobi'
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'user',
    preferences: {
      therapyTypes: ['Depression'],
      preferredModes: ['In-Person'],
      location: 'Mombasa'
    }
  }
];

const admins = [
  {
    name: 'Admin User',
    email: 'admin@afyanafsi.com',
    password: 'admin123',
    role: 'admin'
  }
];

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing data...');
    await Therapist.deleteMany({});
    await User.deleteMany({});
    await Admin.deleteMany({});
    console.log('✅ Cleared existing data');

    console.log('📝 Inserting therapists...');
    await Therapist.insertMany(therapists);
    console.log(`✅ Inserted ${therapists.length} therapists`);

    console.log('📝 Inserting users...');
    await User.insertMany(users);
    console.log(`✅ Inserted ${users.length} users`);

    console.log('📝 Inserting admins...');
    await Admin.insertMany(admins);
    console.log(`✅ Inserted ${admins.length} admins`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 User Login:');
    console.log('   Email: john.doe@example.com');
    console.log('   Password: password123');
    console.log('');
    console.log('👨‍⚕️ Therapist Login:');
    console.log('   Email: sarah.johnson@afyanafsi.com');
    console.log('   Password: password123');
    console.log('');
    console.log('👑 Admin Login:');
    console.log('   Email: admin@afyanafsi.com');
    console.log('   Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();