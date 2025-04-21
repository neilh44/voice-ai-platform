import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// Simplified version - no Recharts dependency to avoid useRef errors
const DashboardAnalytics = () => {
  // Sample data
  const stats = {
    callVolume: {
      total: 65,
      trend: '+12%',
      lastPeriod: 58
    },
    avgDuration: {
      value: '3:00',
      trend: '+5%',
      lastPeriod: '2:51'
    },
    conversion: {
      rate: '23%',
      appointments: 15,
      calls: 65
    },
    satisfaction: {
      rate: '92%',
      positiveRatings: 45,
      totalRatings: 49
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium mb-4">Analytics Details</h3>
      
      {/* First row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Call Volume Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Call Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4">
              <div className="text-4xl font-bold mb-2">{stats.callVolume.total}</div>
              <div className="text-sm text-muted-foreground">Total calls this month</div>
              
              <div className="mt-6 flex justify-center items-center space-x-2">
                <span className="text-green-500 font-medium">{stats.callVolume.trend}</span>
                <span className="text-sm text-muted-foreground">vs last month ({stats.callVolume.lastPeriod} calls)</span>
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
                <div className="flex justify-between items-end h-16">
                  <div className="w-8 bg-blue-500 rounded-t-sm" style={{ height: '40%' }}></div>
                  <div className="w-8 bg-blue-500 rounded-t-sm" style={{ height: '30%' }}></div>
                  <div className="w-8 bg-blue-500 rounded-t-sm" style={{ height: '50%' }}></div>
                  <div className="w-8 bg-blue-500 rounded-t-sm" style={{ height: '70%' }}></div>
                  <div className="w-8 bg-blue-500 rounded-t-sm" style={{ height: '60%' }}></div>
                  <div className="w-8 bg-blue-500 rounded-t-sm" style={{ height: '40%' }}></div>
                  <div className="w-8 bg-blue-500 rounded-t-sm" style={{ height: '20%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call Duration Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Average Call Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4">
              <div className="text-4xl font-bold mb-2">{stats.avgDuration.value}</div>
              <div className="text-sm text-muted-foreground">Minutes per call</div>
              
              <div className="mt-6 flex justify-center items-center space-x-2">
                <span className="text-green-500 font-medium">{stats.avgDuration.trend}</span>
                <span className="text-sm text-muted-foreground">vs last month ({stats.avgDuration.lastPeriod})</span>
              </div>
              
              <div className="mt-6 relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      Current Month
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {stats.avgDuration.value}
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div style={{ width: "75%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                </div>
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">
                      Last Month
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-gray-600">
                      {stats.avgDuration.lastPeriod}
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: "70%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-500"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Second row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Conversion Rate Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4">
              <div className="text-4xl font-bold mb-2">{stats.conversion.rate}</div>
              <div className="text-sm text-muted-foreground">Calls converted to appointments</div>
              
              <div className="mt-6">
                <div className="flex justify-center items-center space-x-1">
                  <span className="text-blue-600 font-medium">{stats.conversion.appointments}</span>
                  <span className="text-sm text-muted-foreground">appointments from</span>
                  <span className="text-blue-600 font-medium">{stats.conversion.calls}</span>
                  <span className="text-sm text-muted-foreground">calls</span>
                </div>
              </div>
              
              <div className="mt-6 relative pt-1">
                <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: stats.conversion.rate }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 rounded-l">
                    {stats.conversion.rate}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Satisfaction Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4">
              <div className="text-4xl font-bold mb-2">{stats.satisfaction.rate}</div>
              <div className="text-sm text-muted-foreground">Positive feedback rate</div>
              
              <div className="mt-6 flex justify-center items-center space-x-2">
                <span className="text-green-500 font-medium">{stats.satisfaction.positiveRatings}</span>
                <span className="text-sm text-muted-foreground">positive ratings out of {stats.satisfaction.totalRatings}</span>
              </div>
              
              <div className="mt-6 relative pt-1">
                <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: stats.satisfaction.rate }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 rounded-l">
                    {stats.satisfaction.rate}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardAnalytics;