import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import AccountsReceivable from './AccountsReceivable';
import AccountsPayable from './AccountsPayable';

// Contacts page wraps AR and AP in tabs
const Contacts = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Contacts</h1>
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="w-full max-w-xs">
          <TabsTrigger value="customers" className="flex-1">Customers</TabsTrigger>
          <TabsTrigger value="vendors" className="flex-1">Vendors</TabsTrigger>
        </TabsList>
        <TabsContent value="customers" className="mt-6"><AccountsReceivable /></TabsContent>
        <TabsContent value="vendors" className="mt-6"><AccountsPayable /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Contacts;
