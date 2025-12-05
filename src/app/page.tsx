import Button from "@/components/ui/Button";
export default function Home() {
  return (
    <div className="font-display bg-background-light dark:bg-background-dark">
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 md:px-10 py-3 bg-white dark:bg-background-dark sticky top-0 z-50">
          <div className="flex items-center gap-4 text-gray-900 dark:text-white">
            <div className="size-6 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
                <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-lg font-bold tracking-[-0.015em]">N.18 Inanam Platform</h2>
          </div>
          <div className="hidden md:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium" href="#">How It Works</a>
              <a className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium" href="#">View Reports</a>
              <a className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium" href="#">About Us</a>
              <a className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm font-medium" href="#">Contact</a>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold">Report an Issue</button>
              <Button asChild variant="outline" className="h-10 px-4">
                <a href="/community/login">Login / Register</a>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex flex-col items-center">
          <div className="w-full max-w-5xl px-4 md:px-0">
            <div className="py-10 md:py-20">
              <div className="p-4">
                <div className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-center p-4 rounded-xl"
                  style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%), url(https://lh3.googleusercontent.com/aida-public/AB6AXuAYn2s28x8UfVqtjC_HS_Fsfedu2LNoJY2ZurG-hjbOp2oYcCL32DPgJlvJTw_s-X7H8BGiZOkPA_NpN5dmicNvpgCWIXrOphWOJhXqkMgsv8r-Rt2mqVGcKXHs5JJLdg0fudbXL90rS2fDIBPu4EvlgsNpXHlBgWrsQTLrG_h3ax6C-HDYpBDd-nRMxi2J8u7evTSDfuDyDAKLXyUwMfc-vpe3_tPrpPWXtj9Z1i2-f-ve58M4V9Kz2bnkNdfngR3XMWD907r4Dlg)'}}>
                  <div className="flex flex-col gap-2 text-center max-w-2xl">
                    <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">Building a Better N.18 Inanam, Together.</h1>
                    <h2 className="text-gray-200 text-sm md:text-base">The official platform for residents to report local issues and drive community-led solutions.</h2>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button className="rounded-lg h-10 md:h-12 px-4 md:px-5 bg-primary text-white text-sm md:text-base font-bold">Report an Issue</button>
                    <button className="rounded-lg h-10 md:h-12 px-4 md:px-5 bg-white dark:bg-gray-200 text-gray-900 text-sm md:text-base font-bold">View Community Reports</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-gray-900 dark:text-white text-[22px] font-bold tracking-[-0.015em] px-4 pb-3 pt-5">Simple Steps to Make a Difference</h2>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 p-4">
              {["Spot & Report","Community & Authority Review","Track Progress & Resolution"].map((title, i) => (
                <div key={i} className="flex flex-1 gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4 flex-col">
                  <div className="text-primary text-3xl">★</div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-gray-900 dark:text-white text-base font-bold leading-tight">{title}</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{i===0?"Easily submit a detailed report about any issue you encounter in the community.":i===1?"Your report is reviewed by community moderators and relevant local authorities.":"Follow the status of your report from submission to final resolution."}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="py-10 md:py-20 px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-4xl font-bold text-primary">1,200+</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Issues Reported</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-primary">950+</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Issues Resolved</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-primary">3,500+</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Active Members</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-gray-900 dark:text-white text-[22px] font-bold tracking-[-0.015em] px-4 pb-3 pt-5">Your Voice, Our Community</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4 py-8">
              {[
                {title:"Transparent Tracking",desc:"Monitor the progress of every report from submission to resolution in real-time."},
                {title:"Direct Communication",desc:"Engage with local authorities and neighbors to work together on solutions."},
                {title:"Collective Problem-Solving",desc:"Be part of a community that actively contributes to making N.18 Inanam better."},
              ].map((item,idx)=> (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="p-3 bg-primary/20 rounded-full mb-4 text-primary">★</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm my-10 md:my-20 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ready to make an impact?</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">Join your neighbors in building a stronger community. Report an issue or register to stay informed.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button className="rounded-lg h-12 px-5 bg-primary text-white text-base font-bold">Report an Issue Now</button>
                <button className="rounded-lg h-12 px-5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-base font-bold">Create an Account</button>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400">
          <div className="px-5 py-8 mx-auto flex items-center sm:flex-row flex-col">
            <a className="flex font-medium items-center text-gray-900 dark:text-white">
              <div className="size-5 text-primary">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
                  <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
                </svg>
              </div>
              <span className="ml-3 text-xl">N.18 Inanam Platform</span>
            </a>
            <p className="text-sm text-gray-500 dark:text-gray-400 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-200 dark:sm:border-gray-700 sm:py-2 sm:mt-0 mt-4">© 2024 N.18 Inanam — All Rights Reserved</p>
            <span className="inline-flex sm:ml-auto sm:mt-0 mt-4 justify-center sm:justify-start">
              <a className="text-gray-500 dark:text-gray-400 hover:text-primary">●</a>
              <a className="ml-3 text-gray-500 dark:text-gray-400 hover:text-primary">●</a>
              <a className="ml-3 text-gray-500 dark:text-gray-400 hover:text-primary">●</a>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
