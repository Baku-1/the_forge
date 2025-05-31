// frontend_forge_ui/src/components/common/Header.jsx
import React from 'react';
// import { Link } from 'react-router-dom'; // For navigation if logo links to home
// import { useWallet } from '../../contexts/WalletContext'; // Assuming a WalletContext

// Mocking useWallet for this example
const useWallet = () => {
    // const [address, setAddress] = React.useState(null); // "0xUserAddress123"
    // const [nxsBalance, setNxsBalance] = React.useState(ethers.parseUnits("0",18));
    // const [isLoading, setIsLoading] = React.useState(false);
    // const connect = async () => { setIsLoading(true); console.log("Connecting..."); await new Promise(r=>setTimeout(r,1000)); setAddress("0xUser123ABC"); setIsLoading(false);};
    // return { address, nxsBalance, connect, isLoading };
    // Simplified for direct use in this snippet:
    return { 
        address: "0xUserAddress123ABCDEF", // Placeholder - replace with actual context value
        nxsBalance: "1234.56", // Placeholder - replace with actual context value (formatted)
        connectWallet: () => console.log("Connect Wallet triggered from Header"), 
        isLoading: false 
    };
};

const truncateAddress = (addr) => addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "";

function Header() {
    const { address, nxsBalance, connectWallet, isLoading } = useWallet(); // Use actual context in your app

    return (
        <header className="p-4 flex justify-between items-center sticky top-0 z-50 header-cyber">
            {/* <Link to="/" className="text-3xl app-title text-cyan-300 cursor-pointer font-orbitron"> */}
            <a href="forge_home.html" className="text-3xl app-title text-cyan-300 cursor-pointer font-orbitron">
                The Kingdom's Forge
            </a>
            {/* </Link> */}
            
            <div id="wallet-section-header"> {/* Unique ID if needed */}
                {!address ? (
                    <button 
                        id="connectWalletBtnHeader" // Unique ID if needed
                        onClick={connectWallet} 
                        disabled={isLoading} 
                        className="btn btn-connect-wallet text-sm"
                    >
                        <i className="fas fa-wallet mr-2"></i>
                        {isLoading ? "Connecting..." : "Connect Wallet"}
                    </button>
                ) : (
                    <div className="wallet-address-display text-sm">
                        <span>{truncateAddress(address)}</span>
                        {nxsBalance && ( /* Only show NXS balance if available and relevant */
                            <span className="ml-2 pl-2 border-l border-border-cyber">
                                ({nxsBalance} $NXS)
                            </span>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

// export default Header;
