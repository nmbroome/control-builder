import "./globals.css";

export const metadata = {
  title: "Control Builder",
  description: "Build and manage compliance controls for credit unions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
