import React, { useEffect } from "react";
import $ from "jquery"; // Ensure jQuery is installed in your project
import "./index.css"; // Adjust the path as per your file structure

const Navbar = () => {
  // Function to handle the responsive navbar animation
  const test = () => {
    const tabsNewAnim = $("#navbarSupportedContent");
    const activeItemNewAnim = tabsNewAnim.find(".active");
    const activeWidthNewAnimHeight = activeItemNewAnim.innerHeight();
    const activeWidthNewAnimWidth = activeItemNewAnim.innerWidth();
    const itemPosNewAnim = activeItemNewAnim.position();

    $(".hori-selector").css({
      top: `${itemPosNewAnim.top}px`,
      left: `${itemPosNewAnim.left}px`,
      height: `${activeWidthNewAnimHeight}px`,
      width: `${activeWidthNewAnimWidth}px`,
    });

    $("#navbarSupportedContent").on("click", "li", function () {
      $("#navbarSupportedContent ul li").removeClass("active");
      $(this).addClass("active");

      const activeWidthNewAnimHeight = $(this).innerHeight();
      const activeWidthNewAnimWidth = $(this).innerWidth();
      const itemPosNewAnim = $(this).position();

      $(".hori-selector").css({
        top: `${itemPosNewAnim.top}px`,
        left: `${itemPosNewAnim.left}px`,
        height: `${activeWidthNewAnimHeight}px`,
        width: `${activeWidthNewAnimWidth}px`,
      });
    });
  };

  // React's useEffect to handle DOM-ready and event listeners
  useEffect(() => {
    setTimeout(() => {
      test();
    }, 0);

    $(window).on("resize", () => {
      setTimeout(() => {
        test();
      }, 500);
    });

    $(".navbar-toggler").click(() => {
      $(".navbar-collapse").slideToggle(300);
      setTimeout(() => {
        test();
      });
    });

    const path = window.location.pathname.split("/").pop() || "index.html";
    const target = $(`#navbarSupportedContent ul li a[href="${path}"]`);
    target.parent().addClass("active");
  }, []);

  // Return JSX for the Navbar
  return (
    <nav className="navbar navbar-expand-custom navbar-mainbg">
      <a className="navbar-brand navbar-logo" href="#">
        
      </a>
      <button
        className="navbar-toggler"
        type="button"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <i className="fas fa-bars text-white"></i>
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav ml-auto">
          <div className="hori-selector">
            <div className="left"></div>
            <div className="right"></div>
          </div>
          <li className="nav-item">
            <a className="nav-link" href="javascript:void(0);">
              <i className="fas fa-tachometer-alt"></i>Dashboard
            </a>
          </li>
          <li className="nav-item active">
            <a className="nav-link" href="javascript:void(0);">
              <i className="far fa-address-book"></i>Address Book
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="javascript:void(0);">
              <i className="far fa-clone"></i>Components
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="javascript:void(0);">
              <i className="far fa-calendar-alt"></i>Calendar
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="javascript:void(0);">
              <i className="far fa-chart-bar"></i>Charts
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="javascript:void(0);">
              <i className="far fa-copy"></i>Documents
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
