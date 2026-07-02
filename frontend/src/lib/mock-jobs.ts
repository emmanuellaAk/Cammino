import type { Job } from '@/types'

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString()
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000).toISOString().split('T')[0]

export const MOCK_JOBS: Job[] = [
  // SAVED
  {
    id: 'm-1', jobTitle: 'Junior Frontend Developer', company: 'Notion',
    location: 'Remote', status: 'SAVED', source: 'LinkedIn',
    notesCount: 0, createdAt: daysAgo(3), updatedAt: daysAgo(3),
  },
  {
    id: 'm-2', jobTitle: 'Graduate Software Engineer', company: 'Monzo',
    location: 'London, UK', status: 'SAVED', source: 'Company website',
    notesCount: 1, createdAt: daysAgo(5), updatedAt: daysAgo(5),
  },

  // APPLIED
  {
    id: 'm-3', jobTitle: 'Software Engineer', company: 'Stripe',
    location: 'London, UK', status: 'APPLIED', source: 'LinkedIn',
    salary: '£70k – £90k', appliedAt: daysAgo(5),
    notesCount: 2, createdAt: daysAgo(6), updatedAt: daysAgo(5),
  },
  {
    id: 'm-4', jobTitle: 'Graduate Engineer', company: 'Deliveroo',
    location: 'London, UK', status: 'APPLIED', source: 'Referral',
    appliedAt: daysAgo(14),
    notesCount: 0, createdAt: daysAgo(15), updatedAt: daysAgo(14),
  },
  {
    id: 'm-5', jobTitle: 'Junior Developer', company: 'Revolut',
    location: 'London, UK', status: 'APPLIED',
    deadline: daysFromNow(3), appliedAt: daysAgo(7),
    salary: '£55k – £70k', source: 'LinkedIn',
    notesCount: 1, createdAt: daysAgo(8), updatedAt: daysAgo(7),
  },

  // ASSESSMENT
  {
    id: 'm-6', jobTitle: 'Software Engineer, University Grad', company: 'Meta',
    location: 'London, UK', status: 'ASSESSMENT',
    deadline: daysFromNow(1), source: 'Company website',
    salary: '£85k – £110k',
    notesCount: 3, createdAt: daysAgo(20), updatedAt: daysAgo(2),
  },
  {
    id: 'm-7', jobTitle: 'Backend Engineer', company: 'Palantir',
    location: 'London, UK', status: 'ASSESSMENT',
    deadline: daysFromNow(6), source: 'LinkedIn',
    notesCount: 1, createdAt: daysAgo(12), updatedAt: daysAgo(4),
  },

  // INTERVIEW
  {
    id: 'm-8', jobTitle: 'Software Engineer', company: 'Google',
    location: 'London, UK', status: 'INTERVIEW',
    deadline: daysFromNow(10), source: 'Referral',
    salary: '£90k – £130k',
    notesCount: 5, createdAt: daysAgo(30), updatedAt: daysAgo(1),
  },
  {
    id: 'm-9', jobTitle: 'Technology Analyst', company: 'Goldman Sachs',
    location: 'London, UK', status: 'INTERVIEW',
    source: 'Campus recruitment',
    notesCount: 2, createdAt: daysAgo(25), updatedAt: daysAgo(3),
  },

  // OFFER
  {
    id: 'm-10', jobTitle: 'Junior Software Engineer', company: 'Starling Bank',
    location: 'London, UK', status: 'OFFER',
    deadline: daysFromNow(5), salary: '£60k',
    source: 'LinkedIn',
    notesCount: 4, createdAt: daysAgo(45), updatedAt: daysAgo(2),
  },

  // REJECTED
  {
    id: 'm-11', jobTitle: 'Software Engineer', company: 'Apple',
    location: 'London, UK', status: 'REJECTED',
    source: 'Company website',
    notesCount: 1, createdAt: daysAgo(60), updatedAt: daysAgo(30),
  },
  {
    id: 'm-12', jobTitle: 'Graduate Developer', company: 'HSBC',
    location: 'London, UK', status: 'REJECTED',
    source: 'Gradcracker',
    notesCount: 0, createdAt: daysAgo(40), updatedAt: daysAgo(25),
  },
]
