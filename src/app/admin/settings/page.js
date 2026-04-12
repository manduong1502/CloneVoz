import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export default async function AdminSettings() {
  // Fetch settings from DB
  const settings = await prisma.globalSetting.findMany();
  const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});

  // Server Action to update settings
  async function updateSettings(formData) {
    "use server";
    
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string' && key.startsWith('setting_')) {
        const dbKey = key.replace('setting_', '');
        await prisma.globalSetting.upsert({
          where: { key: dbKey },
          update: { value },
          create: { key: dbKey, value }
        });
      }
    }
    revalidatePath('/admin/settings');
    revalidatePath('/'); // Revalidate Frontend as well to show new names
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Options (Global Settings)</h1>
        <p className="text-sm text-gray-500 mt-1">Configure global site variables from the database.</p>
      </div>
      
      <form action={updateSettings} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
         
         <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm text-gray-700">Site Title</label>
            <p className="text-xs text-gray-500 mb-1">The name of your forum, displayed in the browser tab and header.</p>
            <input 
              type="text" 
              name="setting_site_title" 
              defaultValue={settingsMap['site_title'] || ''} 
              className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
         </div>

         <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm text-gray-700">Site Description</label>
            <p className="text-xs text-gray-500 mb-1">Used for SEO meta tags and social media sharing.</p>
            <textarea 
              name="setting_site_description" 
              defaultValue={settingsMap['site_description'] || ''} 
              className="border border-gray-300 rounded-md p-2 h-24 resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            ></textarea>
         </div>

         <div className="border-t border-gray-100 pt-5 mt-2">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition">
               Save changes
            </button>
         </div>

      </form>
    </div>
  );
}
