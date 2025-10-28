import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUsageMetrics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log('📊 Usage Metrics (Last 30 Days)');
  console.log('================================\n');

  // Total users
  const totalUsers = await prisma.user.count();
  console.log(`👥 Total Users: ${totalUsers}`);

  // New users in last 30 days
  const newUsers = await prisma.user.count({
    where: { createdAt: { gte: thirtyDaysAgo } }
  });
  console.log(`🆕 New Users (30d): ${newUsers}`);

  // Users by plan
  const usersByPlan = await prisma.user.groupBy({
    by: ['plan'],
    _count: true
  });
  console.log('\n💳 Users by Plan:');
  usersByPlan.forEach(({ plan, _count }) => {
    console.log(`  ${plan}: ${_count}`);
  });

  // Total generations (jobs)
  const totalJobs = await prisma.job.count();
  console.log(`\n🎵 Total Generations: ${totalJobs}`);

  // Jobs in last 30 days
  const recentJobs = await prisma.job.count({
    where: { createdAt: { gte: thirtyDaysAgo } }
  });
  console.log(`📈 Generations (30d): ${recentJobs}`);

  // Jobs by status
  const jobsByStatus = await prisma.job.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('\n📊 Jobs by Status:');
  jobsByStatus.forEach(({ status, _count }) => {
    console.log(`  ${status}: ${_count}`);
  });

  // Recent jobs by status (30d)
  const recentJobsByStatus = await prisma.job.groupBy({
    by: ['status'],
    _count: true,
    where: { createdAt: { gte: thirtyDaysAgo } }
  });
  console.log('\n📊 Recent Jobs by Status (30d):');
  recentJobsByStatus.forEach(({ status, _count }) => {
    console.log(`  ${status}: ${_count}`);
  });

  // Total assets created
  const totalAssets = await prisma.asset.count();
  console.log(`\n🎼 Total Assets: ${totalAssets}`);

  // Assets in last 30 days
  const recentAssets = await prisma.asset.count({
    where: { createdAt: { gte: thirtyDaysAgo } }
  });
  console.log(`📈 Assets (30d): ${recentAssets}`);

  // Most active users (by job count)
  const activeUsers = await prisma.user.findMany({
    include: {
      _count: {
        select: { jobs: true, assets: true }
      }
    },
    orderBy: {
      jobs: {
        _count: 'desc'
      }
    },
    take: 5
  });
  console.log('\n🔥 Most Active Users:');
  activeUsers.forEach((user, i) => {
    console.log(`  ${i + 1}. ${user.username} (${user.plan}): ${user._count.jobs} jobs, ${user._count.assets} assets`);
  });

  // Average credits per plan
  const avgCreditsByPlan = await prisma.user.groupBy({
    by: ['plan'],
    _avg: { credits: true },
    _sum: { credits: true }
  });
  console.log('\n💰 Credits by Plan:');
  avgCreditsByPlan.forEach(({ plan, _avg, _sum }) => {
    console.log(`  ${plan}: Avg ${_avg.credits?.toFixed(2)}, Total ${_sum.credits}`);
  });

  // Success rate
  const completedJobs = await prisma.job.count({ where: { status: 'COMPLETED' } });
  const failedJobs = await prisma.job.count({ where: { status: 'FAILED' } });
  const successRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(2) : '0.00';
  console.log(`\n✅ Success Rate: ${successRate}% (${completedJobs} completed, ${failedJobs} failed)`);

  // Daily activity (last 7 days)
  console.log('\n📅 Daily Activity (Last 7 Days):');
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dailyJobs = await prisma.job.count({
      where: {
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    });

    const dailyUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    });

    console.log(`  ${date.toLocaleDateString()}: ${dailyJobs} jobs, ${dailyUsers} new users`);
  }

  await prisma.$disconnect();
}

getUsageMetrics().catch(console.error);
