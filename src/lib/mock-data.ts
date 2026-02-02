export const MOCK_SERVICES = [
    {
        _id: "mock_service_1",
        title: "Professional Logo Design",
        description: "I will create a unique and professional logo for your business. Unlimited revisions included.",
        skills: ["Graphic Design", "Logo Design", "Illustrator"],
        pricingType: "fixed",
        price: 150,
        deliveryTime: "3 days",
        category: "Design & Creative",
        status: "active",
        createdAt: new Date().toISOString(),
        createdBy: "mock_user_1",
    },
    {
        _id: "mock_service_2",
        title: "React Web Application Development",
        description: "Full-stack web development using React, Next.js, and Node.js. High quality and performance optimized.",
        skills: ["React", "Next.js", "TypeScript", "Node.js"],
        pricingType: "hourly",
        price: 60,
        deliveryTime: "14 days",
        category: "Development & IT",
        status: "active",
        createdAt: new Date().toISOString(),
        createdBy: "mock_user_2",
    },
    {
        _id: "mock_service_3",
        title: "SEO Optimization Service",
        description: "Boost your website ranking with our comprehensive SEO package. Keyword research and on-page optimization.",
        skills: ["SEO", "Digital Marketing", "Content Strategy"],
        pricingType: "fixed",
        price: 300,
        deliveryTime: "7 days",
        category: "Sales & Marketing",
        status: "active",
        createdAt: new Date().toISOString(),
        createdBy: "mock_user_3",
    }
];

export const MOCK_PROJECTS = [
    {
        _id: "mock_project_1",
        title: "E-commerce Website Redesign",
        description: "We are looking for an experienced designer to redesign our e-commerce store. Must have experience with Shopify.",
        skills: ["Web Design", "Shopify", "UX/UI"],
        budget: 2000,
        status: "open",
        type: "PROJECT",
        category: "Design & Creative",
        createdAt: new Date().toISOString(),
        createdBy: "mock_client_1",
    },
    {
        _id: "mock_project_2",
        title: "Mobile App Development for Fitness Startup",
        description: "Need a React Native developer to build a fitness tracking app. MVP definition is ready.",
        skills: ["React Native", "Mobile App Development", "iOS", "Android"],
        budget: 5000,
        status: "open",
        type: "PROJECT",
        category: "Development & IT",
        createdAt: new Date().toISOString(),
        createdBy: "mock_client_2",
    }
];

export const MOCK_CONTESTS = [
    {
        _id: "mock_contest_1",
        title: "Catchy Slogan for Coffee Brand",
        description: "We need a short, memorable slogan for our new organic coffee brand.",
        skills: ["Copywriting", "Branding", "Creative Writing"],
        prize: 500,
        status: "open",
        createdAt: new Date().toISOString(),
        createdBy: "mock_client_3",
    }
];

export const MOCK_FREELANCERS = [
    {
        _id: "mock_freelancer_1",
        name: "Alice Johnson",
        title: "Senior UI/UX Designer",
        bio: "Passionate designer with 8 years of experience creating user-centered digital products.",
        skills: ["UI Design", "UX Research", "Figma", "Prototyping"],
        location: "San Francisco, USA",
        avatarUrl: "https://i.pravatar.cc/150?u=mock_freelancer_1",
        role: "freelancer",
        createdAt: new Date().toISOString(),
    },
    {
        _id: "mock_freelancer_2",
        name: "David Smith",
        title: "Full Stack Developer",
        bio: "Specializing in MERN stack development. I build scalable and robust web applications.",
        skills: ["MongoDB", "Express", "React", "Node.js"],
        location: "London, UK",
        avatarUrl: "https://i.pravatar.cc/150?u=mock_freelancer_2",
        role: "freelancer",
        createdAt: new Date().toISOString(),
    },
    {
        _id: "mock_freelancer_3",
        name: "Sarah Lee",
        title: "Content Marketing Specialist",
        bio: "Helping brands tell their story through compelling content and data-driven strategies.",
        skills: ["Content Writing", "SEO", "Social Media Marketing"],
        location: "Toronto, Canada",
        avatarUrl: "https://i.pravatar.cc/150?u=mock_freelancer_3",
        role: "freelancer",
        createdAt: new Date().toISOString(),
    }
];

export const MOCK_COURSES = [
    {
        _id: "mock_course_1",
        title: "Complete Web Development Bootcamp",
        description: "Become a full-stack web developer with just one course. HTML, CSS, Javascript, Node, React, MongoDB and more!",
        skills: ["Web Development", "React", "Node.js"],
        price: 99,
        category: "Development & IT",
        createdAt: new Date().toISOString(),
        instructor: "Angela Dr. Yu"
    },
    {
        _id: "mock_course_2",
        title: "Digital Marketing Masterclass",
        description: "Master Digital Marketing Strategy, Social Media Marketing, SEO, YouTube, Email, Facebook Marketing, Analytics & More!",
        skills: ["Digital Marketing", "SEO", "Social Media"],
        price: 85,
        category: "Sales & Marketing",
        createdAt: new Date().toISOString(),
        instructor: "Phil Ebiner"
    }
];
