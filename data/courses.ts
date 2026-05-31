export interface Instructor {
  name: string
  title: string
  avatar: string
  bio: string[]
  education?: string[]
  social: {
    linkedin?: string
    facebook?: string
    instagram?: string
  }
}

export interface CourseInfo {
  topic: string
  schedule: string
  instructor: string
  sessions: string
  location: string
  capacity: string
}

export interface Audience {
  title: string
  description: string
}

export interface Privilege {
  title: string
  description: string
}

export interface Course {
  id: number
  slug: string
  mode: 'offline' | 'online'
  title: string
  category: string[]
  heroImage: string
  mobileImage?: string  // Optional mobile-optimized image
  price: {
    amount: string
    currency: 'VNĐ' | 'USD'
    deposit?: string
  }
  paymentId: number
  info: CourseInfo
  mission: string
  testimonials: string[]
  curriculum?: string
  instructors: Instructor[]
  audience: Audience[]
  privileges: Privilege[]
  registrationOpen?: boolean
}

export const courses: Course[] = [
  {
    id: 1,
    slug: 'suc-manh-vo-han',
    mode: 'offline',
    title: 'program_detail.courses.suc_manh_vo_han.title',
    category: ['categories.entrepreneur', 'categories.business'],
    heroImage: '/images/programs/suc-manh-vo-han.jpg',
    price: {
      amount: '180.000.000',
      currency: 'VNĐ',
      deposit: '180.000.000'
    },
    paymentId: 58,
    info: {
      topic: 'program_detail.courses.suc_manh_vo_han.topic',
      schedule: '5/3-8/3/2025',
      instructor: 'program_detail.courses.suc_manh_vo_han.instructor',
      sessions: 'program_detail.courses.suc_manh_vo_han.sessions',
      location: 'program_detail.courses.suc_manh_vo_han.location',
      capacity: 'program_detail.courses.suc_manh_vo_han.capacity'
    },
    mission: 'program_detail.courses.suc_manh_vo_han.mission_desc',
    testimonials: ['Dm6gg-LHGqs', 'qEBZwBE449o', 'RDKjAQLf5w0'],
    curriculum: '/images/programs/la-chinh-minh.jpg',
    instructors: [
      {
        name: 'NhiLe',
        title: 'Doanh nhân',
        avatar: '/images/people/nhile.jpg',
        bio: [
          '15 năm kinh nghiệm trên thương trường tại Singapore và Việt Nam',
          'Là một Doanh nhân | Nhà Tâm lý học | Người lãnh đạo cộng đồng',
          'Thay đổi và tạo cảm hứng cho hơn 2000 người Việt ở khắp nơi trên thế giới',
          'Làm việc và là nhà lãnh đạo trong nhiều lĩnh vực tại cả Việt Nam và Singapore'
        ],
        education: [
          'Professional Certificate in Business Coaching (SMU) | Chứng chỉ Chuyên nghiệp về Đào tạo Doanh nghiệp (Đại học SMU)',
          'Resilient Leadership and Business Sustainability Series (SMU) | Chuỗi chương trình Lãnh đạo Kiên cường và Phát triển Bền vững trong Kinh doanh (Đại học SMU)',
          'Certification in Artificial Intelligence (AI) in Marketing (SMU) | Chứng chỉ về Ứng dụng Trí tuệ Nhân tạo (AI) trong Marketing (Đại học SMU)',
          'Diploma in Psychology – Kaplan Singapore | Văn bằng Tâm lý học - Đại học Kaplan, Singapore'
        ],
        social: {
          linkedin: 'https://www.linkedin.com/in/nhisg/',
          facebook: 'https://www.facebook.com/nhile.sg',
          instagram: 'https://www.instagram.com/nhile.sg/'
        }
      },
      {
        name: 'Mel',
        title: 'Chuyên gia Marketing',
        avatar: '/images/people/mel.jpg',
        bio: [
          'Melvin Soh, chuyên gia marketing hàng đầu châu Á, nổi tiếng với hơn 15 năm kinh nghiệm thực chiến trong xây dựng thương hiệu và thu hút khách hàng. Anh đã giúp hàng trăm doanh nghiệp tạo dựng lòng trung thành và tăng trưởng bền vững.'
        ],
        social: {
          facebook: 'https://www.facebook.com/@melvinsohonline',
          instagram: 'https://www.instagram.com/thegreatmelvinsoh'
        }
      }
    ],
    audience: [],
    privileges: []
  },
  {
    id: 2,
    slug: 'la-chinh-minh',
    mode: 'offline',
    title: 'program_detail.courses.la_chinh_minh.title',
    category: ['categories.personal_development', 'categories.be_yourself'],
    heroImage: '/images/programs/la-chinh-minh.jpg',
    price: {
      amount: '68.690.000',
      currency: 'VNĐ'
    },
    paymentId: 57,
    info: {
      topic: 'program_detail.courses.la_chinh_minh.topic',
      schedule: '27 - 30 tháng 8 / 2026',
      instructor: 'program_detail.courses.la_chinh_minh.instructor',
      sessions: 'program_detail.courses.la_chinh_minh.sessions',
      location: 'program_detail.courses.la_chinh_minh.location',
      capacity: 'program_detail.courses.la_chinh_minh.capacity'
    },
    mission: 'program_detail.courses.la_chinh_minh.mission_desc',
    testimonials: ['PFWDwSf5EGc', 'RAaXaJxFXpE', '8qq6WDQFFQk'],
    curriculum: '/images/programs/la-chinh-minh.jpg',
    instructors: [
      {
        name: 'NhiLe',
        title: 'Doanh nhân',
        avatar: '/images/people/nhile.jpg',
        bio: [
          '15 năm kinh nghiệm trên thương trường tại Singapore và Việt Nam',
          'Là một Doanh nhân | Nhà Tâm lý học | Người lãnh đạo cộng đồng',
          'Thay đổi và tạo cảm hứng cho hơn 2000 người Việt ở khắp nơi trên thế giới.',
          'Làm việc và là nhà lãnh đạo trong nhiều lĩnh vực tại cả Việt Nam và Singapore.'
        ],
        education: [
          'Professional Certificate in Business Coaching (SMU) | Chứng chỉ Chuyên nghiệp về Đào tạo Doanh nghiệp (Đại học SMU)',
          'Resilient Leadership and Business Sustainability Series (SMU) | Chuỗi chương trình Lãnh đạo Kiên cường và Phát triển Bền vững trong Kinh doanh (Đại học SMU)',
          'Certification in Artificial Intelligence (AI) in Marketing (SMU) | Chứng chỉ về Ứng dụng Trí tuệ Nhân tạo (AI) trong Marketing (Đại học SMU)',
          'Diploma in Psychology – Kaplan Singapore | Văn bằng Tâm lý học - Đại học Kaplan, Singapore'
        ],
        social: {
          linkedin: 'https://www.linkedin.com/in/nhisg/',
          facebook: 'https://www.facebook.com/nhile.sg',
          instagram: 'https://www.instagram.com/nhile.sg/'
        }
      }
    ],
    audience: [],
    privileges: []
  },
  {
    id: 9,
    slug: 'la-chinh-minh-review',
    mode: 'offline',
    title: 'Là Chính Mình 05 (Review)',
    category: ['categories.personal_development', 'categories.be_yourself'],
    heroImage: '/images/programs/la-chinh-minh.jpg',
    price: {
      amount: '11.296.000',
      currency: 'VNĐ'
    },
    paymentId: 57,
    info: {
      topic: 'program_detail.courses.la_chinh_minh.topic',
      schedule: '27 - 30 tháng 8 / 2026',
      instructor: 'program_detail.courses.la_chinh_minh.instructor',
      sessions: 'program_detail.courses.la_chinh_minh.sessions',
      location: 'program_detail.courses.la_chinh_minh.location',
      capacity: 'program_detail.courses.la_chinh_minh.capacity'
    },
    mission: 'program_detail.courses.la_chinh_minh.mission_desc',
    testimonials: ['PFWDwSf5EGc', 'RAaXaJxFXpE', '8qq6WDQFFQk'],
    curriculum: '/images/programs/la-chinh-minh.jpg',
    instructors: [
      {
        name: 'NhiLe',
        title: 'Doanh nhân',
        avatar: '/images/people/nhile.jpg',
        bio: [
          '15 năm kinh nghiệm trên thương trường tại Singapore và Việt Nam',
          'Là một Doanh nhân | Nhà Tâm lý học | Người lãnh đạo cộng đồng',
          'Thay đổi và tạo cảm hứng cho hơn 2000 người Việt ở khắp nơi trên thế giới.',
          'Làm việc và là nhà lãnh đạo trong nhiều lĩnh vực tại cả Việt Nam và Singapore.'
        ],
        education: [
          'Professional Certificate in Business Coaching (SMU) | Chứng chỉ Chuyên nghiệp về Đào tạo Doanh nghiệp (Đại học SMU)',
          'Resilient Leadership and Business Sustainability Series (SMU) | Chuỗi chương trình Lãnh đạo Kiên cường và Phát triển Bền vững trong Kinh doanh (Đại học SMU)',
          'Certification in Artificial Intelligence (AI) in Marketing (SMU) | Chứng chỉ về Ứng dụng Trí tuệ Nhân tạo (AI) trong Marketing (Đại học SMU)',
          'Diploma in Psychology – Kaplan Singapore | Văn bằng Tâm lý học - Đại học Kaplan, Singapore'
        ],
        social: {
          linkedin: 'https://www.linkedin.com/in/nhisg/',
          facebook: 'https://www.facebook.com/nhile.sg',
          instagram: 'https://www.instagram.com/nhile.sg/'
        }
      }
    ],
    audience: [],
    privileges: []
  },
  /*
    {
      id: 3,
      slug: 'gen-ai-101',
      mode: 'online',
      title: 'program_detail.courses.gen_ai_101.title',
      category: ['categories.ai'],
      heroImage: '/images/thumbnails/yt-1.png',
      price: {
        amount: '13.069.000',
        currency: 'VNĐ'
      },
      paymentId: 78,
      info: {
        topic: 'program_detail.courses.gen_ai_101.topic',
        schedule: '5/3-8/3/2025',
        instructor: 'program_detail.courses.gen_ai_101.instructor',
        sessions: 'program_detail.courses.gen_ai_101.sessions',
        location: 'program_detail.courses.gen_ai_101.location',
        capacity: 'program_detail.courses.gen_ai_101.capacity'
      },
      mission: 'program_detail.courses.gen_ai_101.description',
      testimonials: ['Dm6gg-LHGqs'],
      instructors: [
        {
          name: 'Linda Hui-Isaac',
          title: 'Doanh nhân',
          avatar: '/images/people/linda.jpg',
          bio: [
            'Với hơn 20 năm kinh nghiệm quốc tế trong chiến lược thương hiệu và tiếp thị số, Linda Hui-Isaac là chuyên gia hàng đầu về AI Marketing và Digital Transformation. Bà từng đảm nhiệm vai trò cố vấn cho các doanh nghiệp lớn, SMEs, tổ chức chính phủ, cũng như tập đoàn đa quốc gia – bao gồm các công ty niêm yết SGX và thương hiệu xa xỉ châu Âu.'
          ],
          social: {
            linkedin: 'https://www.linkedin.com/in/nhisg/',
            facebook: 'https://www.facebook.com/nhile.sg',
            instagram: 'https://www.instagram.com/nhile.sg/'
          }
        }
      ],
      audience: [],
      privileges: []
    },
  */
  {
    id: 4,
    slug: 'thuong-hieu-cua-ban',
    mode: 'online',
    title: 'program_detail.courses.thuong_hieu_cua_ban.title',
    category: ['categories.branding'],
    heroImage: '/images/programs/thuong-hieu-cua-ban.png',
    price: {
      amount: '18.960.000',
      currency: 'VNĐ'
    },
    paymentId: 53,
    info: {
      topic: 'program_detail.courses.thuong_hieu_cua_ban.topic',
      schedule: 'program_detail.courses.thuong_hieu_cua_ban.schedule',
      instructor: 'program_detail.courses.thuong_hieu_cua_ban.instructor',
      sessions: 'program_detail.courses.thuong_hieu_cua_ban.sessions',
      location: 'program_detail.courses.thuong_hieu_cua_ban.location',
      capacity: 'program_detail.courses.thuong_hieu_cua_ban.capacity'
    },
    mission: 'program_detail.courses.thuong_hieu_cua_ban.description',
    testimonials: ['Dm6gg-LHGqs'],
    instructors: [
      {
        name: 'NhiLe',
        title: 'Doanh nhân',
        avatar: '/images/people/nhile.jpg',
        bio: [
          'Tốt nghiệp chuyên ngành Tâm lý học tại Kaplan Professional, Singapore. Nhi Le có nhiều năm kinh nghiệm hỗ trợ khách hàng tại Singapore và Việt Nam, giúp họ vượt qua thách thức cuộc sống và làm chủ cuộc đời họ.'
        ],
        social: {
          linkedin: 'https://www.linkedin.com/in/nhisg/',
          facebook: 'https://www.facebook.com/nhile.sg',
          instagram: 'https://www.instagram.com/nhile.sg/'
        }
      }
    ],
    audience: [],
    privileges: []
  },
  {
    id: 5,
    slug: 'cuoc-song-cua-ban',
    mode: 'online',
    title: 'program_detail.courses.cuoc_song_cua_ban.title',
    category: ['categories.personal_development'],
    heroImage: '/images/programs/cuoc-song-cua-ban.png',
    price: {
      amount: '18.960.000',
      currency: 'VNĐ'
    },
    paymentId: 54,
    info: {
      topic: 'program_detail.courses.cuoc_song_cua_ban.topic',
      schedule: 'program_detail.courses.cuoc_song_cua_ban.schedule',
      instructor: 'program_detail.courses.cuoc_song_cua_ban.instructor',
      sessions: 'program_detail.courses.cuoc_song_cua_ban.sessions',
      location: 'program_detail.courses.cuoc_song_cua_ban.location',
      capacity: 'program_detail.courses.cuoc_song_cua_ban.capacity'
    },
    mission: 'program_detail.courses.cuoc_song_cua_ban.description',
    testimonials: ['Dm6gg-LHGqs'],
    instructors: [
      {
        name: 'NhiLe',
        title: 'Doanh nhân',
        avatar: '/images/people/nhile.jpg',
        bio: [
          'Tốt nghiệp chuyên ngành Tâm lý học tại Kaplan Professional, Singapore. Nhi Le có nhiều năm kinh nghiệm hỗ trợ khách hàng tại Singapore và Việt Nam, giúp họ vượt qua thách thức cuộc sống và làm chủ cuộc đời họ.'
        ],
        social: {
          linkedin: 'https://www.linkedin.com/in/nhisg/',
          facebook: 'https://www.facebook.com/nhile.sg',
          instagram: 'https://www.instagram.com/nhile.sg/'
        }
      }
    ],
    audience: [],
    privileges: []
  },
  /*
    {
      id: 6,
      slug: 'ai-for-business-communication',
      mode: 'online',
      title: 'program_detail.courses.ai_for_business_communication.title',
      category: ['categories.applied_ai'],
      heroImage: '/images/thumbnails/yt-2.png',
      price: {
        amount: '23.609.000',
        currency: 'VNĐ'
      },
      paymentId: 79,
      info: {
        topic: 'program_detail.courses.ai_for_business_communication.topic',
        schedule: '5/3-8/3/2025',
        instructor: 'program_detail.courses.ai_for_business_communication.instructor',
        sessions: 'program_detail.courses.ai_for_business_communication.sessions',
        location: 'program_detail.courses.ai_for_business_communication.location',
        capacity: 'program_detail.courses.ai_for_business_communication.capacity'
      },
      mission: 'program_detail.courses.ai_for_business_communication.description',
      testimonials: ['Dm6gg-LHGqs'],
      instructors: [
        {
          name: 'Linda Hui-Isaac',
          title: 'Chuyên gia chiến lược AI & Cố vấn Marketing',
          avatar: '/images/people/linda.jpg',
          bio: [
            'Với hơn 20 năm kinh nghiệm quốc tế trong chiến lược thương hiệu và tiếp thị số, Linda Hui-Isaac là chuyên gia hàng đầu về AI Marketing và Digital Transformation. Bà từng đảm nhiệm vai trò cố vấn cho các doanh nghiệp lớn, SMEs, tổ chức chính phủ, cũng như tập đoàn đa quốc gia – bao gồm các công ty niêm yết SGX và thương hiệu xa xỉ châu Âu.'
          ],
          social: {
            linkedin: 'https://www.linkedin.com/in/nhisg/',
            facebook: 'https://www.facebook.com/nhile.sg',
            instagram: 'https://www.instagram.com/nhile.sg/'
          }
        }
      ],
      audience: [],
      privileges: []
    },
  */
  /*
    {
      id: 7,
      slug: 'ai-in-marketing',
      mode: 'online',
      title: 'program_detail.courses.ai_in_marketing.title',
      category: ['categories.digital_marketing'],
      heroImage: '/images/thumbnails/yt-3.png',
      price: {
        amount: '28.985.000',
        currency: 'VNĐ'
      },
      paymentId: 80,
      info: {
        topic: 'program_detail.courses.ai_in_marketing.topic',
        schedule: '5/3-8/3/2025',
        instructor: 'program_detail.courses.ai_in_marketing.instructor',
        sessions: 'program_detail.courses.ai_in_marketing.sessions',
        location: 'program_detail.courses.ai_in_marketing.location',
        capacity: 'program_detail.courses.ai_in_marketing.capacity'
      },
      mission: 'program_detail.courses.ai_in_marketing.description',
      testimonials: ['Dm6gg-LHGqs'],
      instructors: [
        {
          name: 'Linda Hui-Isaac',
          title: 'Chuyên gia chiến lược AI & Cố vấn Marketing',
          avatar: '/images/people/linda.jpg',
          bio: [
            'Với hơn 20 năm kinh nghiệm quốc tế trong chiến lược thương hiệu và tiếp thị số, Linda Hui-Isaac là chuyên gia hàng đầu về AI Marketing và Digital Transformation. Bà từng đảm nhiệm vai trò cố vấn cho các doanh nghiệp lớn, SMEs, tổ chức chính phủ, cũng như tập đoàn đa quốc gia – bao gồm các công ty niêm yết SGX và thương hiệu xa xỉ châu Âu.'
          ],
          social: {
            linkedin: 'https://www.linkedin.com/in/nhisg/',
            facebook: 'https://www.facebook.com/nhile.sg',
            instagram: 'https://www.instagram.com/nhile.sg/'
          }
        }
      ],
      audience: [],
      privileges: []
    },
  */
  {
    id: 8,
    slug: 'thu-thach-30-ngay',
    mode: 'online',
    title: 'thirty_day_challenge.title',
    category: ['categories.personal_development'],
    heroImage: '/course/30days_desktop.png', // Primary image used in listings
    price: {
      amount: '396.000',
      currency: 'VNĐ'
    },
    paymentId: 99,
    info: {
      topic: 'thirty_day_challenge.topic',
      schedule: '28/12/2025 – 28/01/2026',
      instructor: 'thirty_day_challenge.mentor.role',
      sessions: '30 ngày',
      location: 'Online',
      capacity: 'Unlimited'
    },
    mission: 'thirty_day_challenge.about_content',
    testimonials: [],
    instructors: [
      {
        name: 'Denise',
        title: 'thirty_day_challenge.mentor.role',
        avatar: '/images/people/denise.jpg',
        bio: ['thirty_day_challenge.mentor.desc_1', 'thirty_day_challenge.mentor.desc_2'],
        social: {}
      }
    ],
    audience: [],
    privileges: [],
    registrationOpen: false,
    // Add mobileImage property to explicitly handle responsive images
    mobileImage: '/course/30days_mobile.png'  // Mobile optimized image for the course page
  }
]

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find(course => course.slug === slug)
}

export function getCoursesByMode(mode: 'offline' | 'online'): Course[] {
  return courses.filter(course => course.mode === mode)
}
