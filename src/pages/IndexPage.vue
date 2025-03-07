<template>
  <q-page padding>
    <!-- Header Section -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12">
        <q-card class="dashboard-header">
          <q-card-section>
            <h4 class="text-h4 q-my-none">Dashboard Overview</h4>
            <p class="text-subtitle1 q-mt-sm">Welcome back! Here's your performance summary</p>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section>
            <div class="text-subtitle2">Total Users</div>
            <div class="text-h4">1,254</div>
            <q-linear-progress :value="0.7" class="q-mt-sm" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section>
            <div class="text-subtitle2">Revenue</div>
            <div class="text-h4">$24,580</div>
            <q-linear-progress :value="0.6" color="positive" class="q-mt-sm" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section>
            <div class="text-subtitle2">Tasks</div>
            <div class="text-h4">42/65</div>
            <q-linear-progress :value="0.42" color="warning" class="q-mt-sm" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section>
            <div class="text-subtitle2">Alerts</div>
            <div class="text-h4">5</div>
            <q-linear-progress :value="0.2" color="negative" class="q-mt-sm" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Main Content -->
    <div class="row q-col-gutter-md">
      <!-- Chart Component -->
      <div class="col-12 col-md-8">
        <q-card class="chart-card">
          <q-card-section>
            <div class="text-h6">Monthly Performance</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="chart-placeholder">
              <div class="chart-bars">
                <div
                  v-for="n in 6"
                  :key="`bar-${n}`"
                  class="chart-bar"
                  :style="`height: ${Math.random() * 80 + 20}%`"
                  :data-value="`${Math.floor(Math.random() * 100)}`"
                ></div>
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-actions>
            <q-btn flat label="View Details" />
            <q-btn flat label="Export" icon="download" />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Activity List -->
      <div class="col-12 col-md-4">
        <q-card class="activity-card">
          <q-card-section>
            <div class="text-h6">Recent Activity</div>
          </q-card-section>
          <q-separator />
          <q-list>
            <q-item v-for="n in 5" :key="`activity-${n}`">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">{{ n }}</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>Activity {{ n }}</q-item-label>
                <q-item-label caption>Lorem ipsum dolor sit amet</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="accent">New</q-badge>
              </q-item-section>
            </q-item>
          </q-list>
          <q-separator />
          <q-card-actions align="right">
            <q-btn flat label="View All" />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Data Table -->
      <div class="col-12 col-lg-8">
        <q-card class="table-card">
          <q-card-section>
            <div class="text-h6">Project Status</div>
          </q-card-section>
          <q-separator />
          <q-table
            :rows="tableData"
            :columns="columns"
            row-key="name"
            :pagination="{ rowsPerPage: 5 }"
            flat
            bordered
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-chip :color="getStatusColor(props.value)" text-color="white">
                  {{ props.value }}
                </q-chip>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>

      <!-- Form Card -->
      <div class="col-12 col-lg-4">
        <q-card class="form-card">
          <q-card-section>
            <div class="text-h6">Quick Action</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-form @submit.prevent="onSubmit" class="q-gutter-md">
              <q-input v-model="formData.name" label="Name" outlined />
              <q-input v-model="formData.email" label="Email" type="email" outlined />
              <q-select
                v-model="formData.category"
                :options="['Task', 'Meeting', 'Reminder']"
                label="Category"
                outlined
              />
              <q-input
                v-model="formData.description"
                type="textarea"
                label="Description"
                outlined
              />
              <div>
                <q-btn label="Submit" type="submit" color="primary" class="full-width" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const formData = ref({
  name: '',
  email: '',
  category: 'Task',
  description: '',
});

const columns = [
  { name: 'name', align: 'left' as const, label: 'Project', field: 'name' },
  { name: 'owner', align: 'left' as const, label: 'Owner', field: 'owner' },
  { name: 'progress', align: 'center' as const, label: 'Progress', field: 'progress' },
  { name: 'status', align: 'center' as const, label: 'Status', field: 'status' },
  { name: 'deadline', align: 'left' as const, label: 'Deadline', field: 'deadline' },
];

const tableData = [
  {
    name: 'Website Redesign',
    owner: 'John Smith',
    progress: 75,
    status: 'In Progress',
    deadline: '2023-06-30',
  },
  {
    name: 'Mobile App Development',
    owner: 'Sarah Johnson',
    progress: 30,
    status: 'In Progress',
    deadline: '2023-08-15',
  },
  {
    name: 'Database Migration',
    owner: 'Michael Chen',
    progress: 100,
    status: 'Completed',
    deadline: '2023-05-01',
  },
  {
    name: 'API Integration',
    owner: 'Emily Davis',
    progress: 60,
    status: 'In Progress',
    deadline: '2023-06-15',
  },
  {
    name: 'Security Audit',
    owner: 'Robert Wilson',
    progress: 10,
    status: 'Pending',
    deadline: '2023-07-10',
  },
  {
    name: 'Content Strategy',
    owner: 'Amanda Lee',
    progress: 0,
    status: 'Not Started',
    deadline: '2023-07-20',
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case 'Completed':
      return 'positive';
    case 'In Progress':
      return 'primary';
    case 'Pending':
      return 'warning';
    case 'Not Started':
      return 'grey';
    default:
      return 'grey';
  }
}

function onSubmit() {
  // Handle form submission
  console.log('Form submitted:', formData.value);
  // Reset form after submission
  formData.value = {
    name: '',
    email: '',
    category: 'Task',
    description: '',
  };
}
</script>
