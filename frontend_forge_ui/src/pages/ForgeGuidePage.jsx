// frontend_forge_ui/src/pages/ForgeGuidePage.jsx
import React from 'react';
// import { Link } from 'react-router-dom'; // For internal links if needed
// import Header from '../components/common/Header'; // Conceptual
// import Footer from '../components/common/Footer'; // Conceptual

// Helper component for guide sections (optional)
const GuideSection = ({ title, children, id }) => (
    <section id={id} className="card-cyber p-6 md:p-8 mb-10">
        <h2 className="font-orbitron text-2xl md:text-3xl text-accent-green mb-6 border-b-2 border-accent-green pb-2">{title}</h2>
        <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed space-y-4">
            {children}
        </div>
    </section>
);

function ForgeGuidePage() {
    return (
        <>
            {/* <Header /> */}
            {/* <ForgeSubNav active="guide" /> // Assuming a sub-navigation component */}
             <nav className="bg-bg-element-dark shadow-md flex justify-center items-center space-x-2 md:space-x-4 border-b border-border-cyber py-2">
                {/* Example Nav Items (use React Router Links) */}
                <a href="forge_home.html" className="dex-nav-item">Home</a>
                <a href="forge_page.html" className="dex-nav-item">Forge Item</a>
                <a href="my_creations.html" className="dex-nav-item">My Creations</a>
                <a href="#" className="dex-nav-item active">Guide</a>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <header className="text-center mb-12">
                    <h1 className="section-title text-4xl md:text-5xl !border-accent-cyan inline-block">The Forgemaster's Handbook</h1>
                    <p className="text-lg text-text-secondary mt-4 max-w-2xl mx-auto">Unlock the secrets of creation. Learn to wield the power of $NXS and your Ronin NFT legacy to forge unique Kingdom Koders assets.</p>
                </header>

                <GuideSection id="introduction" title="Welcome to The Kingdom's Forge!">
                    <p>The Kingdom's Forge is more than just a crafting station – it's the birthplace of legends within the Kingdom Koders Universe! Here, you have the power to take your existing Ronin Network NFTs, from any supported collection, and even your previously Forged Kingdom Koders NFTs (KKNFTs), and use their very essence to inspire the creation of entirely new, unique game assets.</p>
                    <p>Imagine transforming the spirit of your favorite Axie or the technological marvel of a CyberKong into a powerful new character skin for Ronin Rumble, a unique weapon, or an essential component for Revved Racing. With The Kingdom's Forge, you become a co-creator, shaping items that carry a verifiable lineage and unlock exciting possibilities across our entire ecosystem.</p>
                </GuideSection>

                <GuideSection id="what-you-need" title="The Forging Altar: What You'll Need">
                    <h3 className="font-orbitron text-xl text-accent-cyan mt-4 mb-2">1. Parent NFTs (The Catalysts - Exactly Two):</h3>
                    <p>At the heart of every forge are two "Parent NFTs." These are items from your own Ronin wallet that you select to act as the primary inspiration for your new KKNFT.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>**Diverse Origins:** Parents can be original NFTs from various acclaimed Ronin collections or even KKNFTs you've previously forged yourself!</li>
                        <li>**Non-Destructive Process:** Critically, your Parent NFTs are <strong className="text-accent-green">NOT burned or consumed</strong>. They remain in your wallet. However, to ensure the uniqueness of each forged item's direct ancestry, each specific Parent NFT is "committed" once to a successful forge, meaning it cannot be used as a parent in this exact way again. This "1-Time Forge Commitment" is recorded by The Kingdom's Forge smart contract, adding to its own unique history!</li>
                    </ul>

                    <h3 className="font-orbitron text-xl text-accent-cyan mt-6 mb-2">2. $Nexus ($NXS) Tokens (The Fuel of Creation):</h3>
                    <p>$NXS is the vital energy that powers The Kingdom's Forge. It's required for every forging attempt and plays a crucial role in determining the outcome:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>**Forge Tiers & Rarity/Power:** You'll commit $NXS based on one of our Forge Tiers (e.g., Standard, Enhanced, Prime, Apex). Committing more $NXS (by selecting a higher tier) significantly <strong className="text-accent-magenta">increases your chances of forging a higher Rarity/Power Tier KKNFT</strong> (Common, Uncommon, Rare, Epic, or the coveted Legendary).</li>
                        <li>**Prioritized Attribute Amplification:** Higher $NXS tiers also <strong className="text-accent-magenta">amplify the influence</strong> of any "Prioritized Attribute" you choose to focus on during the forge.</li>
                    </ul>

                    <h3 className="font-orbitron text-xl text-accent-cyan mt-6 mb-2">3. Ronin Wallet & $RON for Gas:</h3>
                    <p>As with all Ronin blockchain interactions, you'll need a connected Ronin Wallet and a small amount of $RON to cover the network transaction fees (gas).</p>
                </GuideSection>

                <GuideSection id="how-to-forge" title="The Art of Forging: Step-by-Step">
                    <p>Ready to create? Here’s how you bring a new KKNFT into existence:</p>
                    <ol className="list-decimal pl-5 space-y-3">
                        <li><strong>Connect Your Ronin Wallet:</strong> Securely connect your wallet to The Kingdom's Forge interface.</li>
                        <li><strong>Select Your Two Parent NFTs:</strong> Choose two NFTs from your collection that you wish to use as inspiration. Consider their traits, "parts," and overall themes, as these will influence the outcome! Remember, previously forged KKNFTs can also be used as parents, allowing for <strong className="text-accent-blue">iterative forging</strong> and the evolution of your creations.</li>
                        <li><strong>Commit $NXS & Choose Your Forge Tier:</strong> Decide how much $NXS power you want to channel into this creation by selecting one of the available Forge Tiers (Standard, Enhanced, Prime, or Apex).</li>
                        <li><strong>Focus the Essence - Prioritize an Attribute (Optional):</strong> This powerful feature allows you to select *one specific trait or part* from one of your chosen Parent NFTs. The Forge will then attempt to strongly reflect this chosen attribute in the new KKNFT. The higher your $NXS Forge Tier, the more influence this prioritized attribute will have.</li>
                        <li><strong>Initiate the Forge (`requestForge`):</strong> Once you're ready, confirm your selections. The specified $NXS fee will be transferred, and an on-chain request is sent to The Kingdom's Forge smart contract. At this point, your selected Parent NFTs are marked with their "1-Time Forge Commitment."</li>
                        <li><strong>The Oracle & Algorithmic Creation (The Magic Happens!):</strong> Our secure off-chain system takes over. It analyzes the "essence" of your Parent NFTs (their metadata, traits, keywords, and your prioritized attribute). Based on this, and influenced by your $NXS commitment, it algorithmically determines the unique traits, rarity tier, and thematic elements for your new KKNFT. The visual is then assembled from Kingdom Koders' exclusive cybertech art component library.</li>
                        <li><strong>Claim Your Creation!:</strong> Once the off-chain process is complete and the new KKNFT is minted on the blockchain by our Oracle, you'll be notified. Your unique KKNFT will appear in your "My Creations" page and your Ronin wallet!</li>
                    </ol>
                </GuideSection>

                <GuideSection id="understanding-kknft" title="Understanding Your Forged KKNFT">
                    <h3 className="font-orbitron text-xl text-accent-cyan mt-4 mb-2">Unique Traits & Rarity Tiers:</h3>
                    <p>Every KKNFT that emerges from the Forge is unique, possessing a distinct combination of traits and belonging to one of five Rarity Tiers: Common, Uncommon, Rare, Epic, or Legendary. This tier often influences its power, appearance, and utility.</p>
                    
                    <h3 className="font-orbitron text-xl text-accent-cyan mt-6 mb-2">The Power of Lineage (Parentage):</h3>
                    <p>Each KKNFT holds a record of its direct "Parent NFTs" in its metadata – this is its `forge_lineage`. This isn't just for show! </p>
                    <p className="font-semibold text-accent-green">The Lineage Bonus System: If you own a KKNFT AND you also own its specific Parent NFTs listed in its lineage, your KKNFT may unlock special privileges, stat boosts, unique abilities, or cosmetic flairs across Kingdom Koders games and dApps! This makes both your Forged KKNFT and its original parents even more valuable within our ecosystem.</p>

                    <h3 className="font-orbitron text-xl text-accent-cyan mt-6 mb-2">Utility - More Than Just an Asset:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>In-Game Power:</strong> KKNFTs are designed for deep integration into our games: Ronin Rumble, Revved Racing, and the upcoming Divine Coliseum. They can be characters, skins, weapons, vehicle parts, or powerful artifacts.</li>
                        <li><strong>NeoTrades Fee Discount:</strong> Owning KKNFTs grants you a fee discount when trading on the NeoTrades marketplace. The more, or rarer, KKNFTs you hold, the better your discount could be!</li>
                        <li><strong>Tradable Assets:</strong> Your unique KKNFTs can, of course, be traded with other players on NeoTrades or other compatible Ronin marketplaces.</li>
                    </ul>
                </GuideSection>

                <GuideSection id="advanced-tips" title="Advanced Forging Tips (For Aspiring ForgeMasters)">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Study Your Inputs:</strong> Pay close attention to the traits, descriptions, and even the collection origin of your Parent NFTs. The Forge algorithm is designed to pick up on these "essences." What makes them special?</li>
                        <li><strong>Strategic Prioritization:</strong> Using the "Prioritized Attribute" feature wisely, especially with a higher $NXS tier, can significantly steer the outcome towards a specific desired characteristic.</li>
                        <li><strong>The Power of Iteration:</strong> Don't forget that a KKNFT you've already forged can become a parent in a *new* forge! This allows you to refine traits, potentially aim for a higher tier, or combine its essence with a completely different Ronin NFT to create something truly unexpected. This is how "living collections" are born.</li>
                        <li><strong>$NXS Investment:</strong> While even Standard Tier forges can produce interesting results, committing more $NXS to reach Enhanced, Prime, or Apex tiers genuinely increases your chances for rarer, more powerful, and more visually complex KKNFTs with stronger prioritized trait manifestation.</li>
                        <li><strong>Community Knowledge:</strong> Keep an eye on what other ForgeMasters are creating! The community may discover particularly potent parent combinations or strategies over time.</li>
                    </ul>
                </GuideSection>

                <GuideSection id="faq" title="Frequently Asked Questions (FAQ)">
                    <p><strong>Q: Are my Parent NFTs burned or lost when I use them in the Forge?</strong><br/>
                    A: No! Your original Parent NFTs are never burned or consumed. They are simply "marked" by our smart contract as having participated once in creating a KKNFT, which contributes to the uniqueness of the KKNFT's lineage. You retain full ownership of your original NFTs.</p>
                    
                    <p><strong>Q: What happens to the $NXS fees I pay for forging?</strong><br/>
                    A: The $NXS fees are vital for the health of the Kingdom Koders ecosystem! They are split to: enhance $NXS liquidity pools on The King's Dex (NXS/RON & NXS/AXS), fund the Treasury Manager role, contribute to an Ecosystem Rewards fund, a portion is burned to create deflationary pressure, and a portion rewards our top KKNFT creators via a leaderboard.</p>

                    <p><strong>Q: How is the KKNFT image created? Is it AI?</strong><br/>
                    A: No, the final visual of your KKNFT is not generated by image AI. Our Forge algorithm determines a unique set of traits for your KKNFT based on your inputs. Then, our system assembles the visual using a vast library of pre-designed, high-quality art components created by the Kingdom Koders art team, ensuring a consistent and cool "cybertech" style. The *inspiration* comes from your NFTs; the *artistry* is Kingdom Koders native.</p>

                    <p><strong>Q: How unique will my Forged KKNFT be?</strong><br/>
                    A: Extremely unique! The combination of two specific parent NFTs (each with their own unique ID and traits), the 1-Time Forge Commitment rule for those parents, the $NXS tier you choose, your optional prioritized attribute, and our algorithm's emergent trait generation ensures that each KKNFT is a distinct creation with its own verifiable lineage.</p>
                    {/* TODO: Add more FAQs as they arise */}
                </GuideSection>

            </main>
            {/* <Footer /> */}
        </>
    );
}

// export default ForgeGuidePage;
