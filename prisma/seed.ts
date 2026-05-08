import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ecospark.com" },
    update: {},
    create: {
      email: "admin@ecospark.com",
      name: "EcoSpark Admin",
      password: adminPassword,
      role: Role.ADMIN,
      bio: "Platform administrator managing sustainable ideas.",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=admin",
    },
  });

  // Create demo member
  const memberPassword = await bcrypt.hash("Member@123456", 12);
  const member = await prisma.user.upsert({
    where: { email: "member@ecospark.com" },
    update: {},
    create: {
      email: "member@ecospark.com",
      name: "Demo Member",
      password: memberPassword,
      role: Role.MEMBER,
      bio: "Passionate about sustainable living and green technology.",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=member",
    },
  });

  // Create categories
  const categories = [
    { name: "Energy", slug: "energy", description: "Renewable and clean energy solutions", icon: "⚡", color: "#F59E0B" },
    { name: "Waste", slug: "waste", description: "Waste reduction and recycling ideas", icon: "♻️", color: "#10B981" },
    { name: "Transportation", slug: "transportation", description: "Sustainable mobility solutions", icon: "🚌", color: "#3B82F6" },
    { name: "Water", slug: "water", description: "Water conservation and management", icon: "💧", color: "#06B6D4" },
    { name: "Agriculture", slug: "agriculture", description: "Sustainable farming and food systems", icon: "🌱", color: "#84CC16" },
    { name: "Community", slug: "community", description: "Community-driven green initiatives", icon: "🤝", color: "#8B5CF6" },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
  }

  // Create sample ideas
  const ideas = [
    {
      title: "Community Solar Micro-Grid Initiative",
      slug: "community-solar-micro-grid-initiative",
      problemStatement: "Rural communities lack access to reliable and affordable electricity.",
      proposedSolution: "Install a community-owned solar micro-grid with battery storage.",
      description: "This project proposes establishing a community-owned solar micro-grid that generates clean energy for up to 500 households. The system includes 200kW of solar panels, 400kWh battery storage, and smart metering. Community members become co-owners, reducing electricity bills by 60% while eliminating carbon emissions.",
      images: [
        "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800",
        "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800"
      ],
      isPaid: false,
      status: "APPROVED" as const,
      categorySlug: "energy",
      authorId: member.id,
    },
    {
      title: "Smart Composting Network for Urban Areas",
      slug: "smart-composting-network-urban-areas",
      problemStatement: "Urban organic waste ends up in landfills, producing methane gas.",
      proposedSolution: "Deploy IoT-enabled smart composting stations throughout the city.",
      description: "A network of 50 smart composting stations equipped with IoT sensors to monitor temperature, moisture, and decomposition progress. The app notifies residents when bins are full and tracks neighborhood composting stats. Resulting compost is distributed to urban gardens and local farms.",
      images: [
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
        "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800"
      ],
      isPaid: true,
      price: 9.99,
      status: "APPROVED" as const,
      categorySlug: "waste",
      authorId: member.id,
    },
    {
      title: "Electric Bike-Share Program for Last-Mile Connectivity",
      slug: "electric-bike-share-last-mile",
      problemStatement: "Public transport gaps force people to use personal cars for short distances.",
      proposedSolution: "Launch an affordable e-bike sharing program integrated with transit.",
      description: "Deploying 500 electric bikes at 50 docking stations near transit hubs. The program integrates with existing transit apps and offers monthly subscriptions. Each bike reduces 2 tons of CO2 annually. GPS tracking, solar-powered docks, and a mobile app make the system seamless.",
      images: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800"
      ],
      isPaid: false,
      status: "APPROVED" as const,
      categorySlug: "transportation",
      authorId: member.id,
    },
    {
      title: "Rainwater Harvesting for Urban Agriculture",
      slug: "rainwater-harvesting-urban-agriculture",
      problemStatement: "Cities waste millions of gallons of rainwater while drought increases.",
      proposedSolution: "Install rooftop rainwater collection systems connected to urban gardens.",
      description: "A comprehensive rainwater harvesting system for apartment buildings that collects, filters, and stores rainwater for irrigation. Each system can collect 50,000 liters annually, reducing municipal water usage by 40%. The filtered water feeds rooftop gardens that supply fresh produce to residents.",
      images: [
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
        "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800"
      ],
      isPaid: true,
      price: 14.99,
      status: "APPROVED" as const,
      categorySlug: "water",
      authorId: member.id,
    },
    {
      title: "Vertical Hydroponic Farms in Abandoned Buildings",
      slug: "vertical-hydroponic-abandoned-buildings",
      problemStatement: "Food deserts in cities and abandoned buildings create dual urban problems.",
      proposedSolution: "Convert vacant buildings into vertical hydroponic farms.",
      description: "Transform empty urban buildings into thriving vertical farms using hydroponic technology. Each 5-story building can produce 50 tons of vegetables annually using 95% less water than traditional farming. LED grow lights run on renewable energy. The produce is sold at local markets with 20% donated to food banks.",
      images: [
        "https://images.unsplash.com/photo-1595429035839-c99c298ffdde?w=800",
        "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800"
      ],
      isPaid: false,
      status: "APPROVED" as const,
      categorySlug: "agriculture",
      authorId: member.id,
    },
    {
      title: "Zero-Waste Community Exchange Platform",
      slug: "zero-waste-community-exchange",
      problemStatement: "Perfectly usable items are thrown away while neighbors need them.",
      proposedSolution: "Create a hyperlocal platform for exchanging, donating, and repairing items.",
      description: "A mobile-first platform where community members can list items for free exchange, organize repair workshops, and track collective impact. Integration with local repair shops offers discounted services. The platform gamifies sustainability with badges and leaderboards, driving engagement and reducing waste by an estimated 30% per participating household.",
      images: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800"
      ],
      isPaid: false,
      status: "APPROVED" as const,
      categorySlug: "community",
      authorId: member.id,
    },
  ];

  for (const idea of ideas) {
    const { categorySlug, ...ideaData } = idea;
    await prisma.idea.upsert({
      where: { slug: idea.slug },
      update: {},
      create: {
        ...ideaData,
        categoryId: createdCategories[categorySlug],
      },
    });
  }

  console.log("✅ Seed completed!");
  console.log("\n📋 Demo Credentials:");
  console.log("Admin: admin@ecospark.com / Admin@123456");
  console.log("Member: member@ecospark.com / Member@123456");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
